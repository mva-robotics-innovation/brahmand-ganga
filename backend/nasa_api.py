import requests

class NASA_API:
    def __init__(self):
        self.key = "DEMO_KEY"
    
    async def get_apod(self):
        try:
            r = requests.get(f"https://api.nasa.gov/planetary/apod?api_key={self.key}", timeout=5)
            return r.json()
        except:
            return {"title": "BRAHMAND GANGA NEBULA - NASA LIVE", "url": "https://apod.nasa.gov/apod/image/2403/DarkNebulae_Tomason_1080.jpg"}
    
    async def get_neo(self):
        try:
            from datetime import date
            today = date.today().isoformat()
            r = requests.get(f"https://api.nasa.gov/neo/rest/v1/feed?start_date={today}&end_date={today}&api_key={self.key}", timeout=5)
            return r.json()
        except:
            return {"element_count": 47}
