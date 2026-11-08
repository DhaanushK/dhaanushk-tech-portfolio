"""Export only inference data from the saved wine model artifacts."""

import argparse
import base64
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from keras.models import load_model

RAW_FEATURES = [
    "fixed acidity",
    "volatile acidity",
    "citric acid",
    "residual sugar",
    "chlorides",
    "free sulfur dioxide",
    "total sulfur dioxide",
    "density",
    "pH",
    "sulphates",
    "alcohol",
]
PRECISION = {
    "fixed acidity": 2,
    "volatile acidity": 3,
    "citric acid": 3,
    "residual sugar": 2,
    "chlorides": 4,
    "free sulfur dioxide": 2,
    "total sulfur dioxide": 2,
    "density": 6,
    "pH": 2,
    "sulphates": 3,
    "alcohol": 2,
}

def encoded_tensor(array):
    values = np.ascontiguousarray(array, dtype="<f4")
    return {
        "shape": list(values.shape),
        "data": base64.b64encode(values.tobytes()).decode("ascii"),
    }


def export_wine(source, wine):
    pipeline = joblib.load(source / "artifacts" / f"{wine}-pipeline.joblib")
    model = load_model(source / "artifacts" / f"{wine}-combined.keras", compile=False)
    mlp = pipeline["mlp"]
    model_data = {
        "features": pipeline["features"],
        "split": int(pipeline["split"]),
        "classes": pipeline["classes"].astype(int).tolist(),
        "rawInputTransform": pipeline["raw_input_transform"],
        "scaler": {
            "mean": pipeline["scaler"].mean_.tolist(),
            "scale": pipeline["scaler"].scale_.tolist(),
        },
        "mlp": {
            "classes": mlp.classes_.astype(int).tolist(),
            "coefs": [encoded_tensor(value) for value in mlp.coefs_],
            "intercepts": [encoded_tensor(value) for value in mlp.intercepts_],
        },
        "combinedWeights": {
            layer.name: [encoded_tensor(value) for value in layer.get_weights()]
            for layer in model.layers
            if layer.get_weights()
        },
    }
    dataset = pd.read_csv(source / "dataset" / f"winequality-{wine}-balanced.csv")
    unique_rows = dataset[RAW_FEATURES].drop_duplicates()
    selected_rows = unique_rows.sample(n=min(128, len(unique_rows)), random_state=41)
    transform = pipeline["raw_input_transform"]
    examples = []
    for _, row in selected_rows.iterrows():
        sample = {}
        for name in RAW_FEATURES:
            if transform["method"] == "minmax":
                raw_value = row[name] * (transform["max"][name] - transform["min"][name]) + transform["min"][name]
            else:
                raw_value = row[name] * transform["scale"][name] + transform["mean"][name]
            sample[name] = round(float(raw_value), PRECISION[name])
        examples.append(sample)
    return model_data, examples


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = {}
    examples = {}
    for wine in ("red", "white"):
        payload[wine], examples[wine] = export_wine(args.source, wine)
    args.output.write_text(
        "window.WINE_ORACLE_MODELS = "
        + json.dumps(payload, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {args.output} ({args.output.stat().st_size:,} bytes)")
    samples_path = args.output.with_name("example-samples.js")
    samples_path.write_text(
        "window.WINE_ORACLE_EXAMPLES = "
        + json.dumps(examples, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {samples_path} ({samples_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
