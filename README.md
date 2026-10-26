# Brahmand Ganga - THE COSMIC RIVER
### NASA Space Apps Challenge 2026 - Astronaut Health + Earth Observation

> **Tagline: Browsing Earth is not just viewing - it is medicine.**
> **Brahmand (ब्रह्मांड)** = The hostile Universe | **Ganga (गंगा)** = The healing view of Home

---

### 1. THE PROBLEM (NASA's Challenge)
Astronauts face radiation, bone loss, stress & isolation. Current health tools are disconnected from Earth observation, even though **Earth-gazing effect** is proven to improve mental health. Health data and Earth data live in silos.

### 2. OUR SOLUTION: One Unified App - INSIDE + OUTSIDE

We link what astronaut **SEES** to how astronaut **FEELS**.

#### MODULE A: OUTSIDE - Earth/Moon/Mars Browser (The Medicine)
- **3D Interactive Globe:** CesiumJS + NASA EPIC, MODIS, LRO data
- **Real-time Threat Map:** Radiation map using NASA DONKI & South Atlantic Anomaly (SAA) data
- **Earth-Gazing Therapy (Our Innovation):** AI suggests calming Earth views (Himalayas, Ganga, Oceans) based on stress level. Homesick? App shows your hometown from ISS view.
- **Psychological Support:** Browse Patna, Haldwani, Home from Space.

#### MODULE B: INSIDE - AI Health Monitor (The Body)
- **Vital Tracking:** Heart Rate, HRV, Sleep Quality, Bone Density Loss %, Radiation Dose
- **Offline Edge AI:** TensorFlow.js running inside spacecraft - predicts health risks WITHOUT internet
- **Emergency System:** Auto-alerts if vitals critical + shows NASA Medical Checklist
- **Privacy First:** All processing on-device, no data sent to Earth.

### 3. INNOVATION - Our Unique Feature
**No one connects External Environment to Internal Health.**
Other apps show vitals OR show Earth. We prove: `Stress ↑ → Suggest Himalaya View → HRV ↓ → Mood ↑`
We turn Earth Observation into a clinical therapy tool.

### 4. TECH STACK
- **Frontend:** CesiumJS, React, Three.js
- **NASA Data:** EPIC (Earth Daily), MODIS, LRO, DONKI (Solar Radiation), ISS Trajectory
- **AI/ML:** TensorFlow.js (Offline), Your backend/ml_models (anomaly_detector, trajectory_predictor)
- **Backend:** Python (FastAPI), NASA Data Processor

### 5. PROJECT STRUCTURE
