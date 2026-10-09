"""Fine-tune and evaluate PhoBERT on the committed stage-one news splits."""
from __future__ import annotations

import argparse
from importlib.metadata import version
import json
import math
import platform
import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import yaml
from sklearn.metrics import (
    average_precision_score,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from training.news.vietnamese import segment_for_phobert


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = ROOT / "configs" / "training.yaml"


def _rooted(path: str | Path) -> Path:
    value = Path(path)
    return value if value.is_absolute() else ROOT / value


def _read_split(path: Path) -> tuple[pd.DataFrame, int]:
    frame = pd.read_csv(path, usecols=["id", "input_text", "label"])
    raw_rows = len(frame)
    frame = frame.dropna(subset=["id", "input_text", "label"])
    frame["label"] = frame["label"].astype(int)
    if not set(frame["label"].unique()).issubset({0, 1}):
        raise ValueError(f"Expected binary labels 0/1 in {path}")
    frame = frame.drop_duplicates(subset=["id"]).drop_duplicates(subset=["input_text"])
    return frame.reset_index(drop=True), raw_rows


def load_splits(config: dict) -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    train, train_raw_rows = _read_split(_rooted(config["train_csv"]))
    validation, validation_raw_rows = _read_split(_rooted(config["validation_csv"]))
    validation_before_overlap_filter = len(validation)
    validation = validation[
        ~validation["id"].isin(train["id"])
        & ~validation["input_text"].isin(train["input_text"])
    ].reset_index(drop=True)
    if train.empty or validation.empty:
        raise ValueError("Training or independent validation split is empty")
    if train["label"].nunique() < 2 or validation["label"].nunique() < 2:
        raise ValueError("Both splits must contain both binary labels")

    details = {
        "split_source": "committed CSV files; no new split generated",
        "train_rows_in_csv": train_raw_rows,
        "validation_rows_in_csv": validation_raw_rows,
        "train_rows_after_deduplication": len(train),
        "validation_rows_after_deduplication": validation_before_overlap_filter,
        "validation_overlap_rows_removed": validation_before_overlap_filter - len(validation),
        "train_label_counts": {str(k): int(v) for k, v in train["label"].value_counts().sort_index().items()},
        "validation_label_counts": {str(k): int(v) for k, v in validation["label"].value_counts().sort_index().items()},
    }
    return train, validation, details


def _limit_split(frame: pd.DataFrame, limit: int | None, seed: int) -> pd.DataFrame:
    if limit is None or limit >= len(frame):
        return frame.reset_index(drop=True)
    if limit < frame["label"].nunique():
        raise ValueError("A limited sample must include at least one row per class")
    selected, _ = train_test_split(
        frame,
        train_size=limit,
        random_state=seed,
        stratify=frame["label"],
    )
    return selected.sort_index().reset_index(drop=True)


def _encode(frame: pd.DataFrame, tokenizer, max_length: int) -> TensorDataset:
    texts = [segment_for_phobert(text) for text in frame["input_text"].astype(str)]
    encoded = tokenizer(
        texts,
        truncation=True,
        max_length=max_length,
        padding="max_length",
        return_tensors="pt",
    )
    return TensorDataset(
        encoded["input_ids"],
        encoded["attention_mask"],
        torch.tensor(frame["label"].to_numpy(), dtype=torch.float32),
    )


def evaluate(model, loader: DataLoader, device: torch.device, threshold: float) -> dict:
    model.eval()
    all_logits: list[np.ndarray] = []
    all_labels: list[np.ndarray] = []
    with torch.inference_mode():
        for input_ids, attention_mask, labels in loader:
            outputs = model(
                input_ids=input_ids.to(device),
                attention_mask=attention_mask.to(device),
            )
            all_logits.append(outputs.logits.reshape(-1).float().cpu().numpy())
            all_labels.append(labels.numpy())

    logits = np.concatenate(all_logits)
    labels = np.concatenate(all_labels).astype(int)
    probabilities = 1.0 / (1.0 + np.exp(-np.clip(logits, -60.0, 60.0)))
    predictions = (probabilities >= threshold).astype(int)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average="binary", zero_division=0
    )
    return {
        "validation_rows": int(len(labels)),
        "threshold": float(threshold),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "average_precision": float(average_precision_score(labels, probabilities)),
    }


def _seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.use_deterministic_algorithms(True, warn_only=True)


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def run(args: argparse.Namespace) -> dict:
    config = yaml.safe_load(args.config.read_text(encoding="utf-8"))["news"]
    seed = int(config["seed"])
    _seed_everything(seed)

    train_frame, validation_frame, split_details = load_splits(config)
    train_frame = _limit_split(train_frame, args.train_limit, seed)
    validation_frame = _limit_split(validation_frame, args.validation_limit, seed + 1)

    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but this PyTorch installation has no CUDA device")
    device_name = args.device
    if device_name == "auto":
        device_name = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device_name)

    model_name = str(args.checkpoint) if args.evaluate_only else config["model_name"]
    model_revision = None if args.evaluate_only else config.get("model_revision")
    tokenizer_options = {"use_fast": False}
    model_options = {"num_labels": 1, "ignore_mismatched_sizes": True}
    if model_revision:
        tokenizer_options["revision"] = model_revision
        model_options["revision"] = model_revision
    tokenizer = AutoTokenizer.from_pretrained(model_name, **tokenizer_options)
    max_length = args.max_length or config["max_length"]
    validation_data = _encode(validation_frame, tokenizer, max_length)
    batch_size = args.batch_size or int(config["batch_size"])
    train_loader = None
    if not args.evaluate_only:
        train_data = _encode(train_frame, tokenizer, max_length)
        generator = torch.Generator().manual_seed(seed)
        train_loader = DataLoader(
            train_data, batch_size=batch_size, shuffle=True,
            generator=generator, num_workers=0,
        )
    validation_loader = DataLoader(
        validation_data, batch_size=batch_size, shuffle=False, num_workers=0,
    )

    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, **model_options
    ).to(device)

    history: list[dict] = []
    optimizer_steps_total = 0
    if args.evaluate_only:
        final_metrics = evaluate(model, validation_loader, device, float(config["threshold"]))
        history.append({"validation": final_metrics})
        run_type = "evaluation"
    else:
        epochs = args.epochs or int(config["epochs"])
        total_steps = max(1, math.ceil(len(train_loader) * epochs))
        warmup_steps = int(total_steps * float(config["warmup_ratio"]))
        negative = int((train_frame["label"] == 0).sum())
        positive = int((train_frame["label"] == 1).sum())
        pos_weight = torch.tensor([negative / max(positive, 1)], dtype=torch.float32, device=device)
        loss_fn = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)

        no_decay = ("bias", "LayerNorm.weight")
        optimizer = torch.optim.AdamW(
            [
                {"params": [p for n, p in model.named_parameters() if not any(k in n for k in no_decay)], "weight_decay": float(config["weight_decay"])},
                {"params": [p for n, p in model.named_parameters() if any(k in n for k in no_decay)], "weight_decay": 0.0},
            ],
            lr=float(config["learning_rate"]),
        )

        def lr_scale(step: int) -> float:
            if warmup_steps and step < warmup_steps:
                return step / max(1, warmup_steps)
            return max(0.0, (total_steps - step) / max(1, total_steps - warmup_steps))

        scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_scale)
        update = 0
        for epoch in range(1, epochs + 1):
            model.train()
            losses: list[float] = []
            for input_ids, attention_mask, labels in train_loader:
                input_ids = input_ids.to(device)
                attention_mask = attention_mask.to(device)
                labels = labels.to(device).reshape(-1, 1)
                optimizer.zero_grad(set_to_none=True)
                logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
                loss = loss_fn(logits, labels)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), float(config["max_grad_norm"]))
                optimizer.step()
                scheduler.step()
                update += 1
                losses.append(float(loss.detach().cpu()))

            epoch_metrics = evaluate(model, validation_loader, device, float(config["threshold"]))
            record = {
                "epoch": epoch,
                "train_loss": float(np.mean(losses)),
                "learning_rate_after_epoch": float(scheduler.get_last_lr()[0]),
                "validation": epoch_metrics,
            }
            history.append(record)
            print(json.dumps(record, ensure_ascii=False), flush=True)
        final_metrics = history[-1]["validation"]
        optimizer_steps_total = update
        run_type = "smoke" if args.train_limit is not None or args.validation_limit is not None else "training"

        if not args.no_save:
            checkpoint_dir = _rooted(args.output_dir or config["checkpoint_dir"])
            model.save_pretrained(checkpoint_dir)
            tokenizer.save_pretrained(checkpoint_dir)
            print(f"Checkpoint saved to {checkpoint_dir}", flush=True)

    report = {
        "run_type": run_type,
        "model": model_name,
        "model_revision": getattr(model.config, "_commit_hash", None) or model_revision,
        "seed": seed,
        "device": str(device),
        "software": {
            "python": platform.python_version(),
            "torch": version("torch"),
            "transformers": version("transformers"),
            "pyvi": version("pyvi"),
            "pandas": version("pandas"),
            "numpy": version("numpy"),
            "scikit-learn": version("scikit-learn"),
        },
        "max_length": max_length,
        "batch_size": batch_size,
        "epochs": 0 if args.evaluate_only else (args.epochs or int(config["epochs"])),
        "split": split_details,
        "rows_used": {
            "train": len(train_frame),
            "validation": len(validation_frame),
            "train_label_counts": {str(k): int(v) for k, v in train_frame["label"].value_counts().sort_index().items()},
            "validation_label_counts": {str(k): int(v) for k, v in validation_frame["label"].value_counts().sort_index().items()},
        },
        "optimizer_steps_total": optimizer_steps_total,
        "history": history,
        "final_metrics": final_metrics,
        "checkpoint_saved": bool(not args.evaluate_only and not args.no_save),
    }
    metrics_path = _rooted(args.metrics_path or config["metrics_path"])
    _write_json(metrics_path, report)
    print(f"Metrics saved to {metrics_path}", flush=True)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--device", choices=("auto", "cpu", "cuda"), default="auto")
    parser.add_argument("--epochs", type=int)
    parser.add_argument("--batch-size", type=int)
    parser.add_argument("--max-length", type=int)
    parser.add_argument("--train-limit", type=int, help="Stratified sample limit for smoke runs")
    parser.add_argument("--validation-limit", type=int, help="Stratified sample limit for smoke runs")
    parser.add_argument("--no-save", action="store_true", help="Skip writing a local model checkpoint")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--metrics-path", type=Path)
    parser.add_argument("--evaluate-only", action="store_true")
    parser.add_argument("--checkpoint", type=Path, help="Trained checkpoint to evaluate")
    args = parser.parse_args()
    args.config = args.config if args.config.is_absolute() else (Path.cwd() / args.config).resolve()
    if args.evaluate_only and not args.checkpoint:
        parser.error("--evaluate-only requires --checkpoint")
    if args.train_limit is not None and args.train_limit < 2:
        parser.error("--train-limit must be at least 2")
    if args.validation_limit is not None and args.validation_limit < 2:
        parser.error("--validation-limit must be at least 2")
    return args


if __name__ == "__main__":
    run(parse_args())
