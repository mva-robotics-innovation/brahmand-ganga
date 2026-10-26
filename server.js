const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const app = express();
const NASA_KEY = process.env.NASA_KEY || 'DEMO_KEY';
app.use(cors());
app.use(express.static(__dirname));
app.get('/api/nasa/apod', async (req,res)=>{
  const r = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`);
  res.json(await r.json());
});
app.get('/api/nasa/neo', async (req,res)=>{
  const today = new Date().toISOString().split('T')[0];
  const r = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
  res.json(await r.json());
});
app.get('/api/telemetry', (req,res)=>{
  res.json({dataProcessed:'4.82TB', latency:'8.3ms', throughput:'1.26GB/s', missionElapsed:new Date().toISOString().slice(11,19)});
});
app.listen(3000, ()=> console.log('Running http://localhost:3000'));
