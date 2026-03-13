import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


"""
seed_db.py — Run this once to populate the database with sample data.
 
Usage (from your back-end directory):
    python seed_db.py
"""
 
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
 
from db.database import SessionLocal, engine
from db import models
 
# Ensure tables exist
models.Base.metadata.create_all(bind=engine)
 
db = SessionLocal()
 
# ── Clear existing data (safe to re-run) ──────────────────────
db.query(models.ShippingRoute).delete()
db.query(models.AcidityZone).delete()
db.query(models.Station).delete()
db.commit()
 
 
# ── Stations ──────────────────────────────────────────────────
stations = [
    dict(name="Arctic Station Alpha",   region="Arctic Ocean",        lat=78.5,   lng=-15.2,  ph=7.95, temp=-1.2, salinity=33.1, depth=120,  trend=-0.003),
    dict(name="North Atlantic Buoy 1",  region="North Atlantic",      lat=52.3,   lng=-30.1,  ph=8.05, temp=12.4, salinity=35.2, depth=200,  trend=-0.001),
    dict(name="North Atlantic Buoy 2",  region="North Atlantic",      lat=45.8,   lng=-40.5,  ph=8.12, temp=14.1, salinity=35.8, depth=180,  trend=0.000),
    dict(name="Caribbean Monitor",      region="Caribbean Sea",       lat=18.2,   lng=-66.5,  ph=8.18, temp=28.3, salinity=36.1, depth=95,   trend=0.001),
    dict(name="Gulf of Mexico Station", region="Gulf of Mexico",      lat=25.5,   lng=-90.2,  ph=8.09, temp=26.7, salinity=36.5, depth=85,   trend=-0.002),
    dict(name="Pacific Station West",   region="North Pacific",       lat=40.1,   lng=160.3,  ph=8.03, temp=10.2, salinity=34.4, depth=310,  trend=-0.002),
    dict(name="Pacific Station East",   region="North Pacific",       lat=38.7,   lng=-145.6, ph=8.07, temp=11.8, salinity=34.1, depth=290,  trend=-0.001),
    dict(name="Coral Sea Monitor",      region="Coral Sea",           lat=-18.4,  lng=150.2,  ph=8.14, temp=27.6, salinity=35.6, depth=75,   trend=-0.001),
    dict(name="Southern Ocean Alpha",   region="Southern Ocean",      lat=-55.2,  lng=-40.3,  ph=7.92, temp=2.1,  salinity=33.8, depth=450,  trend=-0.004),
    dict(name="Southern Ocean Beta",    region="Southern Ocean",      lat=-60.1,  lng=10.5,   ph=7.88, temp=1.4,  salinity=33.5, depth=520,  trend=-0.005),
    dict(name="Indian Ocean North",     region="Indian Ocean",        lat=10.3,   lng=65.4,   ph=8.11, temp=29.1, salinity=36.2, depth=110,  trend=-0.001),
    dict(name="Indian Ocean South",     region="Indian Ocean",        lat=-30.5,  lng=75.8,   ph=8.08, temp=20.4, salinity=35.4, depth=220,  trend=-0.001),
    dict(name="Mediterranean East",     region="Mediterranean Sea",   lat=35.2,   lng=28.6,   ph=8.17, temp=22.3, salinity=38.9, depth=65,   trend=-0.001),
    dict(name="Mediterranean West",     region="Mediterranean Sea",   lat=38.6,   lng=5.2,    ph=8.15, temp=20.1, salinity=37.8, depth=70,   trend=0.000),
    dict(name="Baltic Sea Monitor",     region="Baltic Sea",          lat=58.3,   lng=19.7,   ph=7.98, temp=8.2,  salinity=10.5, depth=40,   trend=-0.003),
    dict(name="North Sea Station",      region="North Sea",           lat=56.1,   lng=3.4,    ph=8.04, temp=9.8,  salinity=34.0, depth=55,   trend=-0.002),
    dict(name="Bering Sea Monitor",     region="Bering Sea",          lat=58.9,   lng=-175.2, ph=7.97, temp=3.5,  salinity=32.8, depth=160,  trend=-0.004),
    dict(name="South China Sea",        region="South China Sea",     lat=12.4,   lng=115.3,  ph=8.10, temp=29.5, salinity=33.2, depth=88,   trend=-0.002),
    dict(name="Tasman Sea Station",     region="Tasman Sea",          lat=-38.2,  lng=157.6,  ph=8.06, temp=18.7, salinity=35.1, depth=195,  trend=-0.001),
    dict(name="Humboldt Current",       region="South Pacific",       lat=-20.3,  lng=-80.5,  ph=7.99, temp=16.2, salinity=34.8, depth=240,  trend=-0.003),
]
 
db.add_all([models.Station(**s) for s in stations])
db.commit()
 
 
# ── Acidity Zones ─────────────────────────────────────────────
zones = [
    dict(name="Arctic Critical Zone",
         ph=7.95,
         coords=[[-20,72],[-10,72],[-10,82],[-20,82],[-20,72]]),
    dict(name="Southern Ocean High-Risk Belt",
         ph=7.88,
         coords=[[-180,-58],[-90,-58],[0,-58],[90,-58],[180,-58],[180,-65],[90,-65],[0,-65],[-90,-65],[-180,-65],[-180,-58]]),
    dict(name="North Pacific Vulnerable Band",
         ph=8.03,
         coords=[[150,35],[180,35],[180,45],[150,45],[150,35]]),
    dict(name="Coral Triangle Zone",
         ph=8.14,
         coords=[[110,-10],[140,-10],[140,10],[110,10],[110,-10]]),
    dict(name="North Atlantic Watch Zone",
         ph=8.05,
         coords=[[-45,45],[-20,45],[-20,58],[-45,58],[-45,45]]),
    dict(name="Baltic Vulnerable Zone",
         ph=7.98,
         coords=[[14,54],[30,54],[30,62],[14,62],[14,54]]),
    dict(name="Caribbean Safe Zone",
         ph=8.18,
         coords=[[-85,10],[-60,10],[-60,25],[-85,25],[-85,10]]),
    dict(name="Bering Sea Critical Zone",
         ph=7.97,
         coords=[[-180,54],[-160,54],[-160,66],[-180,66],[-180,54]]),
]
 
db.add_all([models.AcidityZone(**z) for z in zones])
db.commit()
 
 
# ── Shipping Routes ───────────────────────────────────────────
routes = [
    dict(name="Trans-Atlantic North",
         density="high",
         coords=[[-5,51],[-20,48],[-40,44],[-60,42],[-75,38]]),
    dict(name="Trans-Pacific Main",
         density="high",
         coords=[[121,31],[140,35],[160,38],[180,40],[-160,42],[-140,40],[-122,37]]),
    dict(name="Asia-Europe via Suez",
         density="high",
         coords=[[121,31],[110,20],[80,12],[55,12],[32,30],[28,36],[5,36],[-5,36]]),
    dict(name="South Atlantic Route",
         density="medium",
         coords=[[-9,38],[-15,25],[-20,10],[-25,-5],[-30,-25],[-40,-45]]),
    dict(name="Indian Ocean Corridor",
         density="high",
         coords=[[32,30],[45,15],[55,12],[65,10],[80,8],[95,5],[110,3],[121,31]]),
    dict(name="Arctic Northeast Passage",
         density="low",
         coords=[[30,70],[50,72],[80,74],[110,73],[140,70],[170,67],[180,65]]),
    dict(name="Cape Horn Route",
         density="medium",
         coords=[[-75,38],[-70,20],[-65,-5],[-62,-30],[-65,-55],[-68,-60]]),
    dict(name="Australia-Asia Corridor",
         density="medium",
         coords=[[151,-33],[140,-25],[125,-15],[115,-5],[110,3]]),
]
 
db.add_all([models.ShippingRoute(**r) for r in routes])
db.commit()
 
db.close()
 
print("✅ Database seeded successfully!")
print(f"   {len(stations)} stations")
print(f"   {len(zones)} acidity zones")
print(f"   {len(routes)} shipping routes")
 