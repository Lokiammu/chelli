# -------------------- IMPORTS --------------------
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.inspection import permutation_importance
import matplotlib.pyplot as plt
import joblib
import os

# -------------------- LOAD DATA --------------------
print("\n Loading dataset...")
data_path = os.path.join(os.path.dirname(__file__), 'quality_data.csv')
data = pd.read_csv(data_path)
print(" Dataset loaded successfully!")
print(data.head(), "\n")

# -------------------- PREPROCESSING --------------------
print(" Preprocessing data...")

# Handle missing values if any
data = data.dropna()

# Encode crop names
le = LabelEncoder()
data['crop_encoded'] = le.fit_transform(data['crop'])
print(" Crop Encoding Mapping:", dict(zip(le.classes_, le.transform(le.classes_))), "\n")

# Select features and target (no ethylene_ppm; use 'weight' instead)
X = data[['crop_encoded', 'temp_c', 'humidity', 'gas_ppm', 'hours_since_harvest', 'weight']]
y = data['vqi']

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(" Data split complete.\n")

# Standardize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# -------------------- TRAIN SVM --------------------
print(" Training SVM model...")
svm_model = SVR(kernel='rbf', C=1.0, epsilon=0.1)
svm_model.fit(X_train_scaled, y_train)
print(" Model training complete!\n")

# -------------------- EVALUATE --------------------
y_pred = svm_model.predict(X_test_scaled)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f" MSE: {mse:.4f}")
print(f" RMSE: {rmse:.4f}")
print(f" MAE: {mae:.4f}")
print(f" R²: {r2:.4f}\n")

# -------------------- SAVE MODELS --------------------
model_dir = os.path.dirname(__file__)
joblib.dump(svm_model, os.path.join(model_dir, 'svm_model.joblib'))
joblib.dump(scaler, os.path.join(model_dir, 'scaler.joblib'))
joblib.dump(le, os.path.join(model_dir, 'label_encoder.joblib'))
print("💾 Model, scaler, and encoder saved successfully.\n")

# -------------------- FEATURE IMPORTANCE --------------------
print(" Calculating feature importance...")
result = permutation_importance(svm_model, X_test_scaled, y_test, n_repeats=10, random_state=42)
importances = result.importances_mean
features = X.columns

plt.figure(figsize=(8, 5))
plt.barh(features, importances, color='#1f77b4')
plt.xlabel("Importance")
plt.title("Feature Importance (SVM)")
plt.tight_layout()
plt.savefig(os.path.join(model_dir, 'feature_importance.png'), dpi=300)
print(" Feature importance plot saved.\n")

print(" Training complete! Model is ready for predictions.\n")
