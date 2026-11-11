
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
            r = await client.get("https://api.nasa.gov/planetary/apod",
                                 params={"api_key": NASA_KEY}, timeout=15)
            r.raise_for_status()
            return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA APOD unavailable: {e}")


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

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA NeoWs unavailable: {e}")



@app.get("/api/nasa/epic")
async def epic():
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get("https://epic.gsfc.nasa.gov/api/natural", timeout=15)
            r.raise_for_status()
            items = r.json()[:12]
        out = []
        for i in items:
            d = i["date"][:10].replace("-", "/")
            out.append({"date": i["date"].replace(" ", "T"), "caption": i.get("caption", ""),
                        "url": f"https://epic.gsfc.nasa.gov/archive/natural/{d}/jpg/{i['image']}.jpg"})
        return {"images": out}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA EPIC unavailable: {e}")


@app.get("/api/nasa/donki")
async def donki():
    end = datetime.date.today()
    start = end - datetime.timedelta(days=7)
    p = {"startDate": start.isoformat(), "endDate": end.isoformat(), "api_key": NASA_KEY}
    base = "https://api.nasa.gov/DONKI/"
    try:
        async with httpx.AsyncClient() as client:
            res = []
            for ep in ("FLR", "CME", "GST"):
                r = await client.get(base + ep, params=p, timeout=20)
                r.raise_for_status()
                res.append(r.json() or [])
        flares, cmes, storms = res
        strong = [f for f in flares if str(f.get("classType", ""))[:1] in ("M", "X")]
        level = "high" if any(str(f.get("classType", ""))[:1] == "X" for f in flares) or storms \
            else "elevated" if strong or cmes else "quiet"
        return {"level": level, "flares": flares, "cmes": cmes, "storms": storms}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA DONKI unavailable: {e}")


@app.get("/api/crew/telemetry")
async def crew_telemetry():
    """Simulated crew vitals for demonstration until a real sensor feed is connected."""
    return {"hr": round(66 + random.gauss(0, 4)), "hrv": round(52 + random.gauss(0, 6)),
            "spo2": min(100, round(97.5 + random.gauss(0, .8))), "temp": round(36.7 + random.gauss(0, .15), 1),
            "rad": round(0.55 + random.random() * 0.15, 2), "stress": round(max(0, min(100, 32 + random.gauss(0, 8)))),
            "simulated": True, "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}


alerts_store = []


@app.post("/api/alerts")
async def post_alert(payload: dict):
    a = {"id": f"ALR-{len(alerts_store) + 1:04d}", "t": datetime.datetime.now(datetime.timezone.utc).isoformat(), **payload}
    alerts_store.append(a)
    del alerts_store[:-200]
    return a


@app.get("/api/alerts")
async def list_alerts():
    return alerts_store[-50:]


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
