from __future__ import annotations

import asyncio
import datetime as dt
import logging
import os
import random
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

NASA_KEY = os.getenv("NASA_API_KEY", "").strip() or "DEMO_KEY"
DONKI_BASE_URL = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/"
NASA_API_BASE_URL = "https://api.nasa.gov"
NASA_APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic/"

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("brahmand-ganga")

app = FastAPI(
    title="BRAHMAND GANGA - NASA Live + Python ML AI",
    version="2.0.0",
    description="NASA data services and BRAHMAND GANGA demonstration APIs.",
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*").strip()
allowed_origins = (
    ["*"]
    if allowed_origins_env == "*"
    else [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores are suitable only for a single-process demonstration.
# They reset when the Render service restarts or scales to multiple instances.
history: list[float] = []
alerts_store: list[dict[str, Any]] = []


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def utc_date() -> dt.date:
    return utc_now().date()


def predict_next(vals: list[float]) -> float:
    """Simple linear-trend extrapolation for demonstration telemetry."""
    if len(vals) < 5:
        return vals[-1] if vals else 94.0

    n = len(vals)
    x = list(range(n))
    sx = sum(x)
    sy = sum(vals)
    sxx = sum(i * i for i in x)
    sxy = sum(x[i] * vals[i] for i in range(n))
    denom = n * sxx - sx * sx

    if denom == 0:
        return vals[-1]

    slope = (n * sxy - sx * sy) / denom
    intercept = (sy - slope * sx) / n
    return max(0.0, min(100.0, slope * n + intercept))


async def fetch_json(
    client: httpx.AsyncClient,
    url: str,
    params: dict[str, Any] | None = None,
) -> Any:
    """Fetch JSON without returning secrets or upstream URLs to the browser."""
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


def nasa_key_params(**params: Any) -> dict[str, Any]:
    return {**params, "api_key": NASA_KEY}


# ---------------------------------------------------------------------------
# Health and demonstration telemetry
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "project": "BRAHMAND GANGA",
        "frontend_available": FRONTEND_DIR.exists(),
        "nasa_api_key_configured": bool(os.getenv("NASA_API_KEY", "").strip()),
        "timestamp": utc_now().isoformat(),
    }


@app.get("/api/telemetry")
async def telemetry():
    """Synthetic system telemetry for UI demonstration; not spacecraft telemetry."""
    fuel = 75 + random.random() * 8
    health_value = 93 + random.random() * 3
    shield = 98 + random.random() * 1.5

    data = {
        "dataProcessed": f"{4.82 + random.random() * 0.05:.2f}TB",
        "latency": f"{7.5 + random.random() * 2:.1f}ms",
        "throughput": f"{1.2 + random.random() * 0.4:.2f}GB/s",
        "missionElapsed": utc_now().strftime("%H:%M:%S"),
        "fuel": round(fuel, 1),
        "health": round(health_value, 1),
        "shield": round(shield, 2),
        "timestamp": utc_now().isoformat(),
        "simulated": True,
        "data_note": "Synthetic demonstration telemetry; no spacecraft is connected.",
    }

    history.append(health_value)
    if len(history) > 100:
        history.pop(0)

    data["prediction_next"] = round(predict_next(history), 2)
    data["ai_insights"] = [
        f"Demo telemetry: fuel {fuel:.1f}%, health {health_value:.1f}%, "
        f"shield {shield:.1f}%."
    ]
    return data


# ---------------------------------------------------------------------------
# NASA Astronomy Picture of the Day (APOD)
# NASA migrated APOD to its WordPress API in September 2026.
# Normalize the response so existing frontend code can keep using familiar keys.
# ---------------------------------------------------------------------------

@app.get("/api/nasa/apod")
async def apod():
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            result = await fetch_json(
                client,
                NASA_APOD_URL,
                params=nasa_key_params(),
            )

        if isinstance(result, list):
            result = result[0] if result else {}

        if not isinstance(result, dict):
            raise ValueError("Unexpected APOD response format")

        return {
            "date": result.get("date") or result.get("post_date"),
            "title": result.get("title", ""),
            "explanation": result.get("explanation", ""),
            "media_type": result.get("media_type", "image"),
            "url": result.get("url") or result.get("image_url") or result.get("permalink"),
            "hdurl": result.get("hdurl") or result.get("url") or result.get("image_url"),
            "copyright": result.get("copyright", ""),
            "service": "NASA APOD WordPress API",
        }

    except (httpx.HTTPError, ValueError, KeyError) as exc:
        logger.exception("NASA APOD request failed")
        raise HTTPException(
            status_code=502,
            detail="NASA APOD is temporarily unavailable. Please retry later.",
        ) from exc


# ---------------------------------------------------------------------------
# NASA Near Earth Object Web Service
# ---------------------------------------------------------------------------

@app.get("/api/nasa/neo")
async def neo():
    today = utc_date().isoformat()

    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            result = await fetch_json(
                client,
                f"{NASA_API_BASE_URL}/neo/rest/v1/feed",
                params=nasa_key_params(start_date=today, end_date=today),
            )
        return result

    except httpx.HTTPError as exc:
        logger.exception("NASA NeoWs request failed")
        raise HTTPException(
            status_code=502,
            detail="NASA Near Earth Object data is temporarily unavailable.",
        ) from exc


# ---------------------------------------------------------------------------
# NASA EPIC
# ---------------------------------------------------------------------------

@app.get("/api/nasa/epic")
async def epic():
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            items = await fetch_json(
                client,
                "https://epic.gsfc.nasa.gov/api/natural",
            )

        if not isinstance(items, list):
            raise ValueError("Unexpected EPIC response format")

        output = []
        for item in items[:12]:
            image_name = item.get("image")
            image_date = item.get("date", "")

            if not image_name or len(image_date) < 10:
                continue

            date_path = image_date[:10].replace("-", "/")
            output.append(
                {
                    "date": image_date.replace(" ", "T"),
                    "caption": item.get("caption", ""),
                    "image": image_name,
                    "url": (
                        "https://epic.gsfc.nasa.gov/archive/natural/"
                        f"{date_path}/jpg/{image_name}.jpg"
                    ),
                }
            )

        return {"images": output, "source": "NASA EPIC"}

    except (httpx.HTTPError, ValueError, KeyError) as exc:
        logger.exception("NASA EPIC request failed")
        raise HTTPException(
            status_code=502,
            detail="NASA EPIC imagery is temporarily unavailable.",
        ) from exc


# ---------------------------------------------------------------------------
# NASA CCMC DONKI - Space Weather
#
# New official API base effective 30 September 2026:
# https://ccmc.gsfc.nasa.gov/DONKI-API/get/
#
# DONKI is a public CCMC data API. The NASA api.nasa.gov key is not appended
# to this new CCMC endpoint. NASA_KEY remains used by APOD and NeoWs above.
# ---------------------------------------------------------------------------

DONKI_ENDPOINTS = {
    "FLR": "FLR",
    "CME": "CME",
    "GST": "GST",
    "SEP": "SEP",
    "RBE": "RBE",
}


async def fetch_donki_endpoint(
    client: httpx.AsyncClient,
    endpoint: str,
    start_date: str,
    end_date: str,
) -> tuple[str, Any, str | None]:
    params = {
        "startDate": start_date,
        "endDate": end_date,
    }

    try:
        payload = await fetch_json(
            client,
            f"{DONKI_BASE_URL}{endpoint}",
            params=params,
        )
        if payload is None:
            payload = []
        return endpoint, payload, None
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("DONKI endpoint %s failed: %s", endpoint, str(exc))
        return endpoint, [], "Upstream endpoint temporarily unavailable"


async def fetch_donki_notifications(
    client: httpx.AsyncClient,
    start_date: str,
    end_date: str,
) -> tuple[str, Any, str | None]:
    params = {
        "startDate": start_date,
        "endDate": end_date,
        "type": "all",
    }

    try:
        payload = await fetch_json(
            client,
            f"{DONKI_BASE_URL}notifications",
            params=params,
        )
        if payload is None:
            payload = []
        return "notifications", payload, None
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("DONKI notifications failed: %s", str(exc))
        return "notifications", [], "Upstream endpoint temporarily unavailable"


@app.get("/api/nasa/donki")
async def donki():
    """Return recent DONKI event records, preserving the legacy frontend keys."""
    end_date = utc_date()
    start_date = end_date - dt.timedelta(days=7)
    start = start_date.isoformat()
    end = end_date.isoformat()

    timeout = httpx.Timeout(25.0, connect=10.0)

    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
        ) as client:
            tasks = [
                fetch_donki_endpoint(client, endpoint, start, end)
                for endpoint in DONKI_ENDPOINTS.values()
            ]
            tasks.append(fetch_donki_notifications(client, start, end))
            results = await asyncio.gather(*tasks)

        data: dict[str, Any] = {}
        errors: dict[str, str] = {}

        for endpoint, payload, error in results:
            data[endpoint] = payload
            if error:
                errors[endpoint] = error

        # Preserve the original response keys used by the existing Module 12 UI.
        flares = data.get("FLR", [])
        cmes = data.get("CME", [])
        storms = data.get("GST", [])
        sep_events = data.get("SEP", [])
        rbe_events = data.get("RBE", [])
        notifications = data.get("notifications", [])

        if not any(endpoint not in errors for endpoint in data):
            raise HTTPException(
                status_code=502,
                detail="NASA CCMC DONKI is temporarily unavailable.",
            )

        # This is an event-activity summary only. It is NOT a measured radiation
        # dose, crew exposure, or validated operational radiation forecast.
        has_x_class = any(
            str(event.get("classType", "")).upper().startswith("X")
            for event in flares
            if isinstance(event, dict)
        )
        has_m_class = any(
            str(event.get("classType", "")).upper().startswith("M")
            for event in flares
            if isinstance(event, dict)
        )

        if has_x_class:
            activity_level = "high"
        elif has_m_class or cmes or storms or sep_events or rbe_events:
            activity_level = "elevated"
        else:
            activity_level = "quiet"

        return {
            "success": True,
            "partial": bool(errors),
            "source": "NASA Community Coordinated Modeling Center (CCMC) DONKI",
            "lastUpdated": utc_now().isoformat(),
            "period": {
                "startDate": start,
                "endDate": end,
            },
            "level": activity_level,  # Kept for compatibility with existing UI.
            "activityLevel": activity_level,
            "levelMeaning": (
                "Event activity summary only; not a radiation dose or crew exposure measurement."
            ),
            "flares": flares,
            "cmes": cmes,
            "storms": storms,
            "sep": sep_events,
            "rbe": rbe_events,
            "notifications": notifications,
            "data": data,
            "unavailable": list(errors.keys()),
            "errors": errors,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected DONKI integration error")
        raise HTTPException(
            status_code=502,
            detail="NASA DONKI is temporarily unavailable.",
        ) from exc


# ---------------------------------------------------------------------------
# Crew telemetry demonstration endpoint
# ---------------------------------------------------------------------------

@app.get("/api/crew/telemetry")
async def crew_telemetry():
    """Simulated crew vitals until a real, consented sensor feed is connected."""
    return {
        "hr": round(66 + random.gauss(0, 4)),
        "hrv": round(52 + random.gauss(0, 6)),
        "spo2": min(100, round(97.5 + random.gauss(0, 0.8))),
        "temp": round(36.7 + random.gauss(0, 0.15), 1),
        "rad": round(0.55 + random.random() * 0.15, 2),
        "stress": round(max(0, min(100, 32 + random.gauss(0, 8)))),
        "simulated": True,
        "data_note": (
            "All values are synthetic demonstration data. "
            "The rad field is not a radiation sensor reading."
        ),
        "timestamp": utc_now().isoformat(),
    }


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

@app.post("/api/alerts")
async def post_alert(payload: dict[str, Any]):
    alert = {
        "id": f"ALR-{len(alerts_store) + 1:04d}",
        "t": utc_now().isoformat(),
        **payload,
    }
    alerts_store.append(alert)

    if len(alerts_store) > 200:
        del alerts_store[:-200]

    return alert


@app.get("/api/alerts")
async def list_alerts():
    return alerts_store[-50:]


# ---------------------------------------------------------------------------
# ML prediction demonstration endpoint
# ---------------------------------------------------------------------------

@app.get("/api/ml/predict/{page_id}")
async def ml_predict(page_id: int):
    if not 1 <= page_id <= 30:
        raise HTTPException(status_code=404, detail="Page not found")

    base = 90 + (page_id % 10)
    synthetic_history = [
        base + random.uniform(-2, 2)
        for _ in range(20)
    ]
    next_value = predict_next(synthetic_history)

    return {
        "page_id": page_id,
        "history": synthetic_history,
        "predicted_next": next_value,
        "confidence": None,
        "model": "Synthetic linear-trend demonstration; not a trained predictive model",
        "ai": f"Page {page_id} demonstration trend: {next_value:.1f}%",
        "simulated": True,
    }


# ---------------------------------------------------------------------------
# Static frontend - MUST remain last so API routes are not shadowed.
# ---------------------------------------------------------------------------

if FRONTEND_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="frontend",
    )
