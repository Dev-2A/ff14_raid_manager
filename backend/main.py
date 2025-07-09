from fastapi import FastAPI

from .routers import users, jobs, items, raid_parties, players, gear_sets, loot_records, player_item_priorities, distribution, raid_schedules, statistics
from .db.database import engine
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(items.router)
app.include_router(raid_parties.router)
app.include_router(players.router)
app.include_router(gear_sets.router)
app.include_router(loot_records.router)
app.include_router(player_item_priorities.router)
app.include_router(distribution.router)
app.include_router(raid_schedules.router)
app.include_router(statistics.router)

@app.get("/")
def read_root():
    return {"message": "FF14 Raid Manager API"}
