"""Re-evaluate committed artifacts without fitting or overwriting models.

Run: python -m scripts.evaluate_release_models --output /path/to/report.json
The holdouts measure agreement with supplied labels, not travel safety.
"""
import argparse
import hashlib
import json
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.metrics import (average_precision_score, balanced_accuracy_score,
                             classification_report, precision_recall_fscore_support)

from src.train.weather_classifier import DATASET, MODEL_OUT, ROOT, build_features
from src.train.news_baseline import DEFAULT_MODEL, _read_labeled


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def evaluate():
    rows = pd.read_csv(DATASET)
    years = pd.to_datetime(rows["time"], format="mixed", errors="raise").dt.year
    validation = rows.loc[years == 2025]
    model = joblib.load(MODEL_OUT)
    truth = validation["risk_level_num"].astype(int)
    prediction = model.predict(build_features(validation))
    report = classification_report(truth, prediction, output_dict=True, zero_division=0)

    train = _read_labeled(ROOT / "data/datasets/stage1_train.csv")
    val = _read_labeled(ROOT / "data/datasets/stage1_val.csv")
    val = val[~val["id"].isin(train["id"]) & ~val["input_text"].isin(train["input_text"])]
    news = joblib.load(DEFAULT_MODEL)
    probabilities = news.predict_proba(val["input_text"].astype(str))[:, 1]
    p, r, f1, _ = precision_recall_fscore_support(val["label"], probabilities >= .5, average="binary", zero_division=0)
    return {
        "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
        "retrained": False,
        "weather": {
            "artifact_sha256": sha256(MODEL_OUT), "validation_year": 2025,
            "validation_rows": len(validation),
            "balanced_accuracy": float(balanced_accuracy_score(truth, prediction)),
            "macro_f1": report["macro avg"]["f1-score"], "classification_report": report,
        },
        "news": {
            "artifact_sha256": sha256(DEFAULT_MODEL), "validation_rows": len(val),
            "threshold": .5, "precision": float(p), "recall": float(r), "f1": float(f1),
            "average_precision": float(average_precision_score(val["label"], probabilities)),
        },
    }


if __name__ == "__main__":
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = evaluate()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: {key: value for key, value in v.items() if key != "classification_report"}
                      for k, v in result.items() if isinstance(v, dict)}, indent=2))
