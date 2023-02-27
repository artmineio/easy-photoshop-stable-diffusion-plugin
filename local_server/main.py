from fastapi import FastAPI
from starlette.staticfiles import StaticFiles

from automatic1111 import api as automatic1111_api
from results import api as results_api
from settings import api as settings_api
from utils.constants import OUTPUT_FOLDER_PATH

app = FastAPI()

app.include_router(automatic1111_api.router)
app.include_router(results_api.router)
app.include_router(settings_api.router)


@app.on_event("startup")
async def startup_event():
    OUTPUT_FOLDER_PATH.mkdir(exist_ok=True, parents=True)
    app.mount("/static", StaticFiles(directory=str(OUTPUT_FOLDER_PATH)), name="static")
