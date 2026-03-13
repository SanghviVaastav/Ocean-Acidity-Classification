"""
evaluate_ood.py  -  Evaluate model against out-of-distribution synthetic data.
Run from back-end directory:
    python evaluate_ood.py
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import pandas as pd
from collections import defaultdict

API        = "http://localhost:8000"
CSV_PATH   = "ood_test_dataset.csv"
LABEL_MAP  = {0: "Critical", 1: "Safe", 2: "Vulnerable"}
CLASSES    = ["Safe", "Vulnerable", "Critical"]

def main():
    df = pd.read_csv(CSV_PATH)
    ground_truth = df["ground_truth"].tolist()
    feature_df   = df.drop(columns=["ground_truth"])

    csv_bytes = feature_df.to_csv(index=False).encode()
    r = requests.post(
        f"{API}/api/predict/batch",
        files={"file": ("ood_test_dataset.csv", csv_bytes, "text/csv")},
    )
    if r.status_code != 200:
        print(f"API error {r.status_code}: {r.text}")
        return

    preds_raw   = r.json()["predictions"]
    predictions = [LABEL_MAP.get(p, str(p)) for p in preds_raw]

    correct  = sum(p == g for p, g in zip(predictions, ground_truth))
    total    = len(predictions)
    accuracy = correct / total * 100

    print(f"\n{'='*55}")
    print(f"  OOD Synthetic Dataset — Model Evaluation")
    print(f"{'='*55}")
    print(f"  Dataset        : {CSV_PATH}")
    print(f"  Total samples  : {total}")
    print(f"  Correct        : {correct}")
    print(f"  Incorrect      : {total - correct}")
    print(f"  Accuracy       : {accuracy:.1f}%\n")

    # Per row
    print(f"  {'Row':<5} {'Ground Truth':<14} {'Predicted':<14} {'OK/X'}")
    print(f"  {'-'*46}")
    for i, (gt, pr) in enumerate(zip(ground_truth, predictions), 1):
        mark = "[OK]" if gt == pr else "[X] "
        print(f"  {i:<5} {gt:<14} {pr:<14} {mark}")

    # Confusion matrix
    matrix = defaultdict(lambda: defaultdict(int))
    for gt, pr in zip(ground_truth, predictions):
        matrix[gt][pr] += 1

    print(f"\n  Confusion Matrix (rows = actual, cols = predicted):")
    header = f"  {'':14}" + "".join(f"{c:<14}" for c in CLASSES)
    print(header)
    print(f"  {'-'*55}")
    for gt in CLASSES:
        row = f"  {gt:<14}" + "".join(f"{matrix[gt][pr]:<14}" for pr in CLASSES)
        print(row)

    # Per-class
    print(f"\n  Per-Class Statistics:")
    print(f"  {'Class':<14} {'Support':>8} {'TP':>6} {'FP':>6} {'FN':>6} {'Precision':>11} {'Recall':>9} {'F1':>8}")
    print(f"  {'-'*72}")
    f1_scores = []
    for c in CLASSES:
        support = ground_truth.count(c)
        if support == 0:
            continue
        tp = matrix[c][c]
        fp = sum(matrix[other][c] for other in CLASSES if other != c)
        fn = support - tp
        prec   = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
        recall = tp / support * 100
        f1     = 2 * prec * recall / (prec + recall) if (prec + recall) > 0 else 0
        f1_scores.append(f1)
        print(f"  {c:<14} {support:>8} {tp:>6} {fp:>6} {fn:>6} {prec:>10.1f}% {recall:>8.1f}% {f1:>7.1f}%")

    macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0
    print(f"\n  Macro F1 Score : {macro_f1:.1f}%")
    print(f"  Accuracy       : {accuracy:.1f}%")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
