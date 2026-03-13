"""
evaluate_predictions.py
Run from the back-end directory:
    python evaluate_predictions.py

Sends sample_prediction_test.csv to the batch prediction API
and computes accuracy, per-class metrics, and a confusion matrix.
"""

import requests
import pandas as pd
from collections import defaultdict

API = "http://localhost:8000"
CSV_PATH = "../sample_prediction_test.csv"

LABEL_MAP = {0: "Critical", 1: "Safe", 2: "Vulnerable"}

def main():
    df = pd.read_csv(CSV_PATH)

    if "ground_truth" not in df.columns:
        print("❌ 'ground_truth' column not found in CSV.")
        return

    ground_truth = df["ground_truth"].tolist()
    feature_df = df.drop(columns=["ground_truth"])

    # Send to API
    csv_bytes = feature_df.to_csv(index=False).encode()
    r = requests.post(
        f"{API}/api/predict/batch",
        files={"file": ("batch.csv", csv_bytes, "text/csv")},
    )
    if r.status_code != 200:
        print(f"❌ API error {r.status_code}: {r.text}")
        return

    preds_raw = r.json()["predictions"]
    predictions = [LABEL_MAP.get(p, str(p)) for p in preds_raw]

    # ── Accuracy ──────────────────────────────────────────────
    correct = sum(p == g for p, g in zip(predictions, ground_truth))
    total   = len(predictions)
    accuracy = correct / total * 100

    print(f"\n{'='*45}")
    print(f"  Ocean Acidity Model — Prediction Evaluation")
    print(f"{'='*45}")
    print(f"  Total samples : {total}")
    print(f"  Correct       : {correct}")
    print(f"  Accuracy      : {accuracy:.1f}%\n")

    # ── Per-row results ───────────────────────────────────────
    print(f"  {'Row':<5} {'Ground Truth':<14} {'Predicted':<14} {'✓/✗'}")
    print(f"  {'-'*42}")
    for i, (gt, pr) in enumerate(zip(ground_truth, predictions), 1):
        mark = "✓" if gt == pr else "✗"
        print(f"  {i:<5} {gt:<14} {pr:<14} {mark}")

    # ── Confusion matrix ──────────────────────────────────────
    classes = ["Safe", "Vulnerable", "Critical"]
    matrix  = defaultdict(lambda: defaultdict(int))
    for gt, pr in zip(ground_truth, predictions):
        matrix[gt][pr] += 1

    print(f"\n  Confusion Matrix (rows=actual, cols=predicted):")
    print(f"  {'':12}", end="")
    for c in classes:
        print(f"  {c[:10]:<12}", end="")
    print()
    for gt in classes:
        print(f"  {gt[:12]:<12}", end="")
        for pr in classes:
            print(f"  {matrix[gt][pr]:<12}", end="")
        print()

    # ── Per-class stats ───────────────────────────────────────
    print(f"\n  Per-Class Statistics:")
    print(f"  {'Class':<14} {'Support':<10} {'Correct':<10} {'Recall'}")
    print(f"  {'-'*46}")
    for c in classes:
        support = ground_truth.count(c)
        if support == 0:
            continue
        tp = matrix[c][c]
        recall = tp / support * 100
        print(f"  {c:<14} {support:<10} {tp:<10} {recall:.1f}%")

    print(f"\n{'='*45}\n")


if __name__ == "__main__":
    main()
