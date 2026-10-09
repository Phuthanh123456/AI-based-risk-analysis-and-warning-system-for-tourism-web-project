"""Vietnamese word segmentation used by the PhoBERT model."""


def segment_for_phobert(text: str) -> str:
    """Join multi-syllable Vietnamese words as expected by PhoBERT."""
    try:
        from pyvi import ViTokenizer
    except ImportError as exc:
        raise RuntimeError(
            "PhoBERT needs PyVi. Install requirements-training.txt first."
        ) from exc
    return ViTokenizer.tokenize(str(text or ""))
