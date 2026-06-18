import asyncio
import random
import time
from typing import Dict, Optional
from datetime import datetime

from app.config import settings


class DeviceCommand:
    DISPENSE = "dispense"
    QUERY_STATUS = "query_status"
    HEARTBEAT = "heartbeat"


class DeviceResponse:
    def __init__(self, success: bool, message: str = "", data: Optional[Dict] = None):
        self.success = success
        self.message = message
        self.data = data or {}


class DeviceCommunicationSimulator:
    def __init__(self):
        self._machine_statuses: Dict[str, Dict] = {}
        self._enabled = settings.device_simulator_enabled

    def register_machine(self, machine_code: str, ip_address: str = ""):
        if machine_code not in self._machine_statuses:
            self._machine_statuses[machine_code] = {
                "ip_address": ip_address,
                "status": "online",
                "last_heartbeat": datetime.now(),
                "channels": {},
            }

    def unregister_machine(self, machine_code: str):
        if machine_code in self._machine_statuses:
            del self._machine_statuses[machine_code]

    def set_machine_online(self, machine_code: str, online: bool = True):
        if machine_code in self._machine_statuses:
            self._machine_statuses[machine_code]["status"] = "online" if online else "offline"
            self._machine_statuses[machine_code]["last_heartbeat"] = datetime.now()

    def is_machine_online(self, machine_code: str) -> bool:
        if machine_code not in self._machine_statuses:
            return False
        status = self._machine_statuses[machine_code]["status"]
        return status == "online"

    async def send_dispense_command(
        self,
        machine_code: str,
        channel_code: str,
        quantity: int = 1,
    ) -> DeviceResponse:
        if not self._enabled:
            return DeviceResponse(False, "设备模拟器未启用")

        if machine_code not in self._machine_statuses:
            return DeviceResponse(False, f"机器 {machine_code} 未注册")

        if not self.is_machine_online(machine_code):
            return DeviceResponse(False, f"机器 {machine_code} 离线")

        delay = random.uniform(0.3, 1.5)
        await asyncio.sleep(delay)

        success_rate = 0.95
        if random.random() > success_rate:
            return DeviceResponse(False, f"货道 {channel_code} 出货失败：电机故障")

        self._machine_statuses[machine_code]["last_heartbeat"] = datetime.now()
        self._machine_statuses[machine_code]["channels"][channel_code] = {
            "last_dispense_at": datetime.now(),
            "last_quantity": quantity,
        }

        return DeviceResponse(
            True,
            f"货道 {channel_code} 出货成功",
            {"channel_code": channel_code, "quantity": quantity},
        )

    async def query_machine_status(self, machine_code: str) -> DeviceResponse:
        if not self._enabled:
            return DeviceResponse(False, "设备模拟器未启用")

        if machine_code not in self._machine_statuses:
            return DeviceResponse(False, f"机器 {machine_code} 未注册")

        machine = self._machine_statuses[machine_code]
        return DeviceResponse(
            True,
            "查询成功",
            {
                "status": machine["status"],
                "ip_address": machine["ip_address"],
                "last_heartbeat": machine["last_heartbeat"].isoformat(),
            },
        )

    def get_machine_status_sync(self, machine_code: str) -> Optional[Dict]:
        return self._machine_statuses.get(machine_code)

    def get_all_machines(self) -> Dict[str, Dict]:
        return self._machine_statuses.copy()


device_simulator = DeviceCommunicationSimulator()
