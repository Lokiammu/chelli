import sys
import json
import joblib
import pandas as pd
import os

# Load models
model_dir = os.path.dirname(__file__)
svm_model = joblib.load(os.path.join(model_dir, 'svm_model.joblib'))
scaler = joblib.load(os.path.join(model_dir, 'scaler.joblib'))
le = joblib.load(os.path.join(model_dir, 'label_encoder.joblib'))

# Read input JSON from stdin (or Node.js)
input_data = json.loads(sys.stdin.read())

# Encode crop
crop_encoded = le.transform([input_data["crop"]])[0]

# Create DataFrame with correct feature names
df_input = pd.DataFrame([{
    "crop_encoded": crop_encoded,
    "temp_c": input_data["temp_c"],
    "humidity": input_data["humidity"],
    "gas_ppm": input_data["gas_ppm"],
    "hours_since_harvest": input_data["hours_since_harvest"],
    "weight": input_data["weight"]
}])

# Scale and predict
scaled = scaler.transform(df_input)
pred_vqi = svm_model.predict(scaled)[0]

# Output JSON result
print(json.dumps({"vqi": round(float(pred_vqi), 2)}))
