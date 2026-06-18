from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.schemas.machine import MachineCreate, MachineUpdate
from app.services.device_communication import device_simulator


class MachineService:
    def __init__(self, db: Session):
        self.db = db

    def get_machine(self, machine_id: int) -> Optional[Machine]:
        return self.db.query(Machine).filter(Machine.id == machine_id).first()

    def get_machine_by_code(self, code: str) -> Optional[Machine]:
        return self.db.query(Machine).filter(Machine.code == code).first()

    def list_machines(self, skip: int = 0, limit: int = 100) -> List[Machine]:
        return self.db.query(Machine).offset(skip).limit(limit).all()

    def create_machine(self, machine_create: MachineCreate) -> Machine:
        db_machine = Machine(
            code=machine_create.code,
            name=machine_create.name,
            location=machine_create.location,
            ip_address=machine_create.ip_address,
            total_channels=machine_create.total_channels,
            is_enabled=machine_create.is_enabled,
            status="offline",
        )
        self.db.add(db_machine)
        self.db.commit()
        self.db.refresh(db_machine)

        device_simulator.register_machine(db_machine.code, db_machine.ip_address)

        return db_machine

    def update_machine(self, machine_id: int, machine_update: MachineUpdate) -> Optional[Machine]:
        db_machine = self.get_machine(machine_id)
        if not db_machine:
            return None

        update_data = machine_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_machine, key, value)

        self.db.commit()
        self.db.refresh(db_machine)

        if "ip_address" in update_data:
            device_simulator.register_machine(db_machine.code, db_machine.ip_address)

        return db_machine

    def delete_machine(self, machine_id: int) -> bool:
        db_machine = self.get_machine(machine_id)
        if not db_machine:
            return False

        device_simulator.unregister_machine(db_machine.code)

        self.db.delete(db_machine)
        self.db.commit()
        return True

    def set_machine_online(self, machine_id: int, online: bool = True) -> Optional[Machine]:
        db_machine = self.get_machine(machine_id)
        if not db_machine:
            return None

        db_machine.status = "online" if online else "offline"
        device_simulator.set_machine_online(db_machine.code, online)

        self.db.commit()
        self.db.refresh(db_machine)
        return db_machine

    def get_machine_status_from_device(self, machine_id: int) -> Optional[dict]:
        db_machine = self.get_machine(machine_id)
        if not db_machine:
            return None

        return device_simulator.get_machine_status_sync(db_machine.code)
