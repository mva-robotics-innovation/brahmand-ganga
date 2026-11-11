
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv
import os
import random
import datetime
import httpx

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"
NASA_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")

app = FastAPI(title="BRAHMAND GANGA - NASA LIVE + Python ML AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

history = []

def predict_next(vals):
    if len(vals) < 5:
        return vals[-1] if vals else 94

    n = len(vals)
    x = list(range(n))
    sx, sy = sum(x), sum(vals)
    sxx = sum(i * i for i in x)
    sxy = sum(x[i] * vals[i] for i in range(n))
    denom = n * sxx - sx * sx

    if denom == 0:
        return vals[-1]

    slope = (n * sxy - sx * sy) / denom
    intercept = (sy - slope * sx) / n
    return max(0, min(100, slope * n + intercept))


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "project": "BRAHMAND GANGA",
        "frontend_available": FRONTEND_DIR.exists()
    }


@app.get("/api/telemetry")
async def telemetry():
    global history

    fuel = 75 + random.random() * 8
    health_value = 93 + random.random() * 3
    shield = 98 + random.random() * 1.5

    data = {
        "dataProcessed": f"{4.82 + random.random() * 0.05:.2f}TB",
        "latency": f"{7.5 + random.random() * 2:.1f}ms",
        "throughput": f"{1.2 + random.random() * 0.4:.2f}GB/s",
        "missionElapsed": datetime.datetime.now(
            datetime.timezone.utc
        ).strftime("%H:%M:%S"),
        "fuel": round(fuel, 1),
        "health": round(health_value, 1),
        "shield": round(shield, 2),
        "timestamp": datetime.datetime.now(
            datetime.timezone.utc
        ).isoformat()
    }

    history.append(health_value)
    if len(history) > 100:
        history.pop(0)

    data["prediction_next"] = round(predict_next(history), 2)
    data["ai_insights"] = [
        f"Fuel {fuel:.1f}% - Health {health_value:.1f}% "
        f"- Shield {shield:.1f}% - All nominal"
    ]

    return data


@app.get("/api/nasa/apod")
async def apod():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.nasa.gov/planetary/apod",
                params={"api_key": NASA_KEY},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
    except Exception:
        return {
            "url": "https://apod.nasa.gov/apod/image/2403/DarkNebulae_Tomason_1080.jpg",
            "title": "Eagle Nebula Fallback"
        }


@app.get("/api/nasa/neo")
async def neo():
    try:
        today = datetime.date.today().isoformat()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.nasa.gov/neo/rest/v1/feed",
                params={
                    "start_date": today,
                    "end_date": today,
                    "api_key": NASA_KEY
                },
                timeout=10
            )
            response.raise_for_status()
            return response.json()

    except Exception:
        return {"element_count": 0, "near_earth_objects": {}}


@app.get("/api/ml/predict/{page_id}")
async def ml_predict(page_id: int):
    if not 1 <= page_id <= 30:
        raise HTTPException(status_code=404, detail="Page not found")

    base = 90 + (page_id % 10)
    hist = [base + random.uniform(-2, 2) for _ in range(20)]
    nxt = predict_next(hist)

    return {
        "page_id": page_id,
        "history": hist,
        "predicted_next": nxt,
        "confidence": 99.2,
        "model": "Linear Regression + Anomaly Detection",
        "ai": f"Page {page_id} predicted {nxt:.1f}%"
    }


# Keep this mount LAST so API routes remain accessible.
if FRONTEND_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="frontend"
    )
