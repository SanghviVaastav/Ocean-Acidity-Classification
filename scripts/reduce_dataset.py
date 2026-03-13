"""
reduce_dataset.py
=================
Reduces the large SOCAT parquet (1.8 GB, ~9.6M rows) to a manageable
representative subset (~150,000 rows) using:
  1. Batch reading — never loads the full file into memory at once
  2. Quality filtering in-flight (fCO2rec_flag==2, valid QC flags)
  3. Geographically & temporally stratified sampling to preserve diversity

Output: socat_reduced.parquet  (~10-15 MB)
"""

import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import os, time

# ── Configuration ────────────────────────────────────────────────────────────
PARQUET_PATH   = r"tblSOCATv2022_data.parquet"
OUTPUT_PARQUET = r"socat_reduced.parquet"
OUTPUT_CSV     = r"socat_reduced.csv"

TARGET_ROWS    = 150_000       # desired output rows
BATCH_SIZE     = 200_000       # rows read per batch from parquet
VALID_QC       = {'A', 'B', 'D'}

SELECTED_COLS  = [
    'time', 'lat', 'lon', 'sample_depth',
    'SST', 'sal', 'WOA_SSS', 'NCEP_SLP',
    'ETOPO2_depth', 'dist_to_land', 'PPPP',
    'fCO2rec', 'fCO2rec_flag', 'QC_Flag',
    'xCO2water_SST_dry',
]
# ─────────────────────────────────────────────────────────────────────────────

t0 = time.time()

print("=" * 60)
print("  SOCAT Dataset — Smart Size Reduction")
print("=" * 60)

# --- Step 1: Read total row count from metadata (instant, no data load) ----
pf = pq.ParquetFile(PARQUET_PATH)
total_rows = pf.metadata.num_rows
print(f"\n📂 Source file : {PARQUET_PATH}")
print(f"   Total rows  : {total_rows:,}")
print(f"   Target rows : {TARGET_ROWS:,}  "
      f"({TARGET_ROWS/total_rows*100:.2f}% of original)")

# ── Step 2: Batch-read, filter, stratify ────────────────────────────────────
# Strategy:
#   • Divide lat (-90..90) into 18 bands of 10° each
#   • Divide lon (-180..180) into 36 bands of 10° each  → 648 geo-cells
#   • Divide time into 4 seasonal bins (month quarters)
#   • Collect equal proportions from every populated cell

print("\n🔄 Reading in batches & filtering ...")

cells = {}          # dict[cell_key] -> list[df_chunks]
n_read  = 0
n_kept  = 0

for batch in pf.iter_batches(batch_size=BATCH_SIZE, columns=SELECTED_COLS):
    df_b = batch.to_pandas()
    n_read += len(df_b)

    # Quality filter
    df_b = df_b[df_b['fCO2rec_flag'] == 2]
    df_b = df_b[df_b['QC_Flag'].isin(VALID_QC)]
    df_b = df_b.dropna(subset=['fCO2rec', 'SST', 'lat', 'lon'])

    if df_b.empty:
        continue

    # Stratification keys
    df_b['_lat_bin'] = pd.cut(df_b['lat'],  bins=18, labels=False)
    df_b['_lon_bin'] = pd.cut(df_b['lon'],  bins=36, labels=False)
    df_b['_month']   = pd.to_datetime(df_b['time']).dt.month
    df_b['_season']  = ((df_b['_month'] - 1) // 3)   # 0=DJF,1=MAM,2=JJA,3=SON

    df_b['_cell'] = (df_b['_lat_bin'].astype(str) + '_' +
                     df_b['_lon_bin'].astype(str) + '_' +
                     df_b['_season'].astype(str))

    for cell, grp in df_b.groupby('_cell'):
        grp = grp.drop(columns=['_lat_bin', '_lon_bin', '_month', '_season', '_cell'])
        if cell not in cells:
            cells[cell] = []
        cells[cell].append(grp)

    n_kept += len(df_b)
    pct = n_read / total_rows * 100
    print(f"   Processed {n_read:>9,} / {total_rows:,} rows  "
          f"({pct:5.1f}%)  |  cells found: {len(cells):,}  |  kept: {n_kept:,}")

print(f"\n✅ Finished reading.  Quality rows : {n_kept:,}  "
      f"({n_kept/total_rows*100:.1f}% of original)")

# ── Step 3: Stratified sample from cells ────────────────────────────────────
print(f"\n📊 Sampling {TARGET_ROWS:,} rows using stratified cell sampling ...")

# Merge each cell into one frame, then sample proportionally
cell_frames = []
cell_sizes  = {}

for cell, chunks in cells.items():
    cf = pd.concat(chunks, ignore_index=True)
    cell_sizes[cell] = len(cf)
    cell_frames.append((cell, cf))

total_quality = sum(cell_sizes.values())
sampled_parts = []

for cell, cf in cell_frames:
    proportion   = cell_sizes[cell] / total_quality
    n_from_cell  = max(1, round(TARGET_ROWS * proportion))
    n_from_cell  = min(n_from_cell, len(cf))
    sampled_parts.append(cf.sample(n=n_from_cell, random_state=42))

df_reduced = pd.concat(sampled_parts, ignore_index=True).sample(
    frac=1, random_state=42).reset_index(drop=True)   # shuffle

# Trim to exactly TARGET_ROWS if slight overshoot
if len(df_reduced) > TARGET_ROWS:
    df_reduced = df_reduced.sample(n=TARGET_ROWS, random_state=42).reset_index(drop=True)

print(f"   Final dataset shape : {df_reduced.shape[0]:,} rows × {df_reduced.shape[1]} cols")

# ── Step 4: Quick stats ──────────────────────────────────────────────────────
print("\n📋 Reduced dataset overview:")
print(f"   lat  range  : {df_reduced['lat'].min():.1f}° — {df_reduced['lat'].max():.1f}°")
print(f"   lon  range  : {df_reduced['lon'].min():.1f}° — {df_reduced['lon'].max():.1f}°")
print(f"   fCO2 range  : {df_reduced['fCO2rec'].min():.1f} — {df_reduced['fCO2rec'].max():.1f} µatm")
print(f"   SST  range  : {df_reduced['SST'].min():.1f} — {df_reduced['SST'].max():.1f} °C")
print(f"   Year range  : {pd.to_datetime(df_reduced['time']).dt.year.min()} — {pd.to_datetime(df_reduced['time']).dt.year.max()}")
print(f"   Missing vals: {df_reduced.isnull().sum().sum()}")

# ── Step 5: Save ─────────────────────────────────────────────────────────────
df_reduced.to_parquet(OUTPUT_PARQUET, index=False, engine='pyarrow')
df_reduced.to_csv(OUTPUT_CSV, index=False)

size_parquet = os.path.getsize(OUTPUT_PARQUET) / (1024**2)
size_csv     = os.path.getsize(OUTPUT_CSV)     / (1024**2)

print(f"\n💾 Saved:")
print(f"   {OUTPUT_PARQUET}  →  {size_parquet:.1f} MB")
print(f"   {OUTPUT_CSV}      →  {size_csv:.1f} MB")
print(f"\n⏱  Total time: {time.time()-t0:.0f} seconds")
print("\n✅ Dataset reduction complete! Use 'socat_reduced.parquet' for preprocessing.")
