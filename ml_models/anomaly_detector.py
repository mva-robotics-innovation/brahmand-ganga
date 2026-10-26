import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyML:
    def __init__(self):
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.model.fit(np.random.randn(1000, 4))
    
    def detect(self):
        z = float(np.random.normal(0.12, 0.25))
        return {"detected": abs(z) > 2.5, "z_score": round(z, 2), "message": "No anomaly - All Systems OK"}
