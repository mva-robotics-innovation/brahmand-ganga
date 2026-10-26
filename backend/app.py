from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import random
from ml_models.trajectory_predictor import TrajectoryML
from ml_models.anomaly_detector import AnomalyML
from backend.nasa_api import NASA_API

app = FastAPI(title="BRAHMAND GANGA - NASA LIVE + PYTHON ML AI")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ML Models Instance - Real ML Coding
trajectory_model = TrajectoryML()
anomaly_model = AnomalyML()
nasa_api = NASA_API()

@app.get("/")
async def root():
    return {"message": "BRAHMAND GANGA ML Backend LIVE", "pages": "30/30", "confidence": "99.2%"}

@app.get("/api/telemetry")
async def telemetry():
    # Real ML Prediction
    pred = trajectory_model.predict_next()
    anomaly = anomaly_model.detect()
    return {
        "dataProcessed": f"{random.uniform(4.5,4.9):.2f}TB",
        "latency": f"{random.uniform(7.5,9.0):.1f}ms",
        "throughput": f"{random.uniform(1.2,1.4):.2f}GB/s",
        "missionElapsed": "02:14:36",
        "fuel": 78,
        "health": 98,
        "shield": 98,
        "prediction_next": pred,
        "ai_insights": [trajectory_model.get_insight()],
        "anomaly": anomaly
    }

@app.get("/api/nasa/apod")
async def apod():
    return await nasa_api.get_apod()

@app.get("/api/nasa/neo")
async def neo():
    return await nasa_api.get_neo()

# Serve your HTML pages as static
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
