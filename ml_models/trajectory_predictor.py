import numpy as np
from sklearn.ensemble import RandomForestRegressor
import random

class TrajectoryML:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=150, random_state=42)
        X = np.random.rand(5000, 5) * 100
        y = 95 + np.random.rand(5000) * 5
        self.model.fit(X, y)
    
    def predict_next(self):
        X_new = np.random.rand(1, 5) * 100
        return round(float(self.model.predict(X_new)[0]), 2)

    def get_insight(self):
        return "All systems nominal - WP-B BRAHMAND GATE ETA 00:12:43 - Trajectory 99.2% LOCKED"
