# 🌊 Ocean Acidity Level Categorization (SDG 14)

> **Classifying coastal water regions into Safe, Vulnerable, or Critical acidity levels using machine learning — in support of UN Sustainable Development Goal 14: Life Below Water.**

---

## 📌 Overview

Ocean acidification is a growing threat to marine ecosystems worldwide. This project builds a **multi-class classification system** that evaluates ocean health by categorizing coastal water regions based on dissolved CO₂ levels (fCO₂) measured by ocean sensors.

Using real-world oceanographic data from the **SOCAT v2022 dataset**, the pipeline processes millions of sensor readings, engineers meaningful features (including shipping traffic proxies and seasonal signals), and trains multiple ML classifiers to predict acidity severity.

---

## 🎯 Classification Labels

Acidity categories are defined based on **fugacity of CO₂ (fCO₂)** measured in µatm:

| Class | fCO₂ Threshold | Description |
|---|---|---|
| 🟢 **Safe** | < 380 µatm | Healthy, low-acidity ocean region |
| 🟡 **Vulnerable** | 380 – 450 µatm | Moderate risk, monitoring required |
| 🔴 **Critical** | > 450 µatm | High acidity, serious marine impact |

---

## 📂 Repository Structure

```
Ocean-Acidity-Classification/
│
├── data/
│   ├── ocean_acidity_preprocessed.csv      # Scaled, model-ready dataset
│   ├── ocean_acidity_preprocessed.parquet  # Parquet format (efficient)
│   ├── ocean_acidity_unscaled.csv          # Pre-scaling version
│   └── socat_reduced.parquet               # Stratified reduced SOCAT sample
│
├── notebooks/
│   └── ocean_acidity_classification.ipynb  # Full EDA + Preprocessing + ML pipeline
│
├── scripts/
│   ├── reduce_dataset.py                   # Smart dataset size reduction script
│   └── generate_word_doc.py                # Team contribution report generator
│
├── requirements.txt                        # Python dependencies
├── LICENSE                                 # MIT License
└── README.md
```

---

## 🔬 Dataset

**Source:** [SOCAT — Surface Ocean CO₂ Atlas v2022](https://www.socat.info/)

- **Original size:** ~1.83 GB Parquet / ~9.6 million rows
- **Reduced to:** ~150,000 rows (stratified, quality-filtered sample)

### Features Used

| Feature | Description |
|---|---|
| `fCO2rec` | Reconstructed fugacity of CO₂ (target source) |
| `SST` | Sea Surface Temperature (°C) |
| `sal` / `WOA_SSS` | Salinity measurements |
| `NCEP_SLP` | Sea-level pressure |
| `ETOPO2_depth` | Ocean depth |
| `dist_to_land` | Distance to nearest coastline (shipping proxy) |
| `lat` / `lon` | Geospatial location |
| `time` | Timestamp (used for seasonal encoding) |

### Engineered Features

- **Shipping Traffic Proxy** — Inverse distance-to-land, coastal flags
- **Seasonal Encoding** — Cyclical sine/cosine encoding of month/season
- **Oceanographic Interactions** — SST × Salinity interaction metrics
- **Sensor Calibration Offsets** — Tunable bias correction (±15 µatm sensitivity analysis)

---

## ⚙️ Data Engineering Pipeline

The full preprocessing pipeline consists of:

1. **Dataset Reduction** — Batch-reads the 1.83 GB SOCAT Parquet file, applies quality filters (`fCO2rec_flag == 2`, QC flags A/B/D), and uses **geographically & temporally stratified sampling** (648 geo-cells × 4 seasons) to produce a representative 150K-row dataset.

2. **Data Cleaning** — Drops rows with missing critical values; applies **median-based imputation** for remaining numeric oceanographic variables.

3. **Outlier Treatment** — **IQR-based winsorization** caps extreme values without removing valid data points.

4. **Feature Engineering** — Derives shipping traffic proxies, seasonal signals, and interaction features.

5. **Target Labeling** — Applies CO₂ thresholds to produce the 3-class target variable (`Safe`, `Vulnerable`, `Critical`).

6. **Scaling & Export** — Applies `StandardScaler` and exports final datasets in both CSV and Parquet formats.

---

## 🤖 Machine Learning Models

Four classifiers were trained and evaluated using **Macro F1 Score** as the primary metric:

| Model | Notes |
|---|---|
| **Logistic Regression** | Linear baseline; interpretable coefficients |
| **Decision Tree** | Rule-based; easily visualized |
| **Random Forest** | Ensemble method; robust to overfitting |
| **XGBoost** | Gradient boosting; best performance on imbalanced classes |

> **Primary evaluation metric: Macro F1 Score** — ensures equal treatment across all three acidity classes regardless of class imbalance.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/SanghviVaastav/Ocean-Acidity-Classification.git
cd Ocean-Acidity-Classification

# Install dependencies
pip install -r requirements.txt
```

### Run the Notebook

```bash
jupyter notebook notebooks/ocean_acidity_classification.ipynb
```

### Dataset Reduction (Optional — requires raw SOCAT Parquet)

```bash
python scripts/reduce_dataset.py
```

---

## 🛠️ Tech Stack

| Library | Purpose |
|---|---|
| `pandas` | Data manipulation & analysis |
| `numpy` | Numerical computing |
| `scikit-learn` | ML models, preprocessing, evaluation |
| `xgboost` | Gradient boosted tree classifier |
| `matplotlib` / `seaborn` | Data visualization & EDA |
| `pyarrow` | Efficient Parquet I/O |

---

## 👥 Team Contributions (Cohort 23)

| Member | Role |
|---|---|
| **Vaastav L Sanghvi** | Dataset Discovery & Ingestion — Sourced SOCAT v2022, designed large-scale Parquet loading pipeline |
| **Saayanth** | Data Quality Assessment & Cleaning — QC flag filtering, median imputation strategy |
| **Sadiya Kulsum** | Sensor Calibration & Feature Engineering — Calibration offsets, seasonal/shipping feature engineering |
| **Vrushank Skanda B** | Target Extraction, EDA & Final Pipeline — CO₂ thresholds, IQR winsorization, StandardScaler, export |

---

## 🌍 SDG Alignment

This project directly supports **UN SDG 14 — Life Below Water** by:
- Providing a data-driven tool to monitor ocean acidification at scale
- Enabling early identification of **Critical** coastal zones for conservation action
- Demonstrating how open oceanographic data (SOCAT) can be used for environmental ML

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <i>Built with 💙 for the oceans — Cohort 23 | SDG 14: Life Below Water</i>
</p>
