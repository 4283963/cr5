from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.database import Base, engine, SessionLocal
from app.models.machine import Machine
from app.routers import tags, machines, channels, orders
from app.services.device_communication import device_simulator

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        machines = db.query(Machine).all()
        for machine in machines:
            device_simulator.register_machine(machine.code, machine.ip_address)
            if machine.status == "online":
                device_simulator.set_machine_online(machine.code, True)
        print(f"已加载 {len(machines)} 台机器注册到设备模拟器")
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tags.router, prefix="/api/v1")
app.include_router(machines.router, prefix="/api/v1")
app.include_router(channels.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")


@app.get("/", summary="根路径")
def root():
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health", summary="健康检查")
def health_check():
    return {"status": "healthy"}
