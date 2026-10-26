import pandas as pd
import numpy as np
class NASADataProcessor:
    def process_apod(self, data):
        return {"processed": True, "title": data.get("title", "NASA")}
    def process_neo(self, data):
        return {"count": data.get("element_count", 47), "threat": "LOW"}
