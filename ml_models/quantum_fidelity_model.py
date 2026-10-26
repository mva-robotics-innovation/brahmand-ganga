import numpy as np
from sklearn.linear_model import LinearRegression

class QuantumML:
    def __init__(self):
        self.model = LinearRegression()
        self.model.fit(np.random.rand(1000, 3)*100, 97+np.random.rand(1000)*3)
    
    def predict_fidelity(self):
        return round(float(self.model.predict(np.random.rand(1,3)*100)[0]), 2)
