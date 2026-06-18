from typing import List, Optional
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.channel import Channel
from app.models.machine import Machine
from app.schemas.channel import ChannelCreate, ChannelUpdate


class ChannelService:
    def __init__(self, db: Session):
        self.db = db

    def get_channel(self, channel_id: int) -> Optional[Channel]:
        return self.db.query(Channel).filter(Channel.id == channel_id).first()

    def get_channel_by_code(self, machine_id: int, channel_code: str) -> Optional[Channel]:
        return (
            self.db.query(Channel)
            .filter(Channel.machine_id == machine_id, Channel.channel_code == channel_code)
            .first()
        )

    def list_channels_by_machine(self, machine_id: int) -> List[Channel]:
        return (
            self.db.query(Channel)
            .filter(Channel.machine_id == machine_id)
            .order_by(Channel.channel_code)
            .all()
        )

    def list_channels_by_tag(self, tag_id: int) -> List[Channel]:
        return self.db.query(Channel).filter(Channel.tag_id == tag_id).all()

    def list_available_channels_by_tag(self, machine_id: int, tag_id: int) -> List[Channel]:
        return (
            self.db.query(Channel)
            .filter(
                Channel.machine_id == machine_id,
                Channel.tag_id == tag_id,
                Channel.is_enabled == True,
                Channel.stock > 0,
                Channel.status == "normal",
            )
            .all()
        )

    def list_available_channels_by_tag_stale_first(
        self, machine_id: int, tag_id: int, stale_days: int = 30
    ) -> List[Channel]:
        now = datetime.now()
        stale_threshold = now - timedelta(days=stale_days)

        never_dispensed = case(
            (Channel.last_dispense_at.is_(None), 1),
            else_=0,
        )

        is_stale = case(
            (Channel.last_dispense_at.is_(None), 1),
            (Channel.last_dispense_at <= stale_threshold, 1),
            else_=0,
        )

        effective_date = case(
            (Channel.stock_in_at.is_(None), Channel.created_at),
            else_=Channel.stock_in_at,
        )

        return (
            self.db.query(Channel)
            .filter(
                Channel.machine_id == machine_id,
                Channel.tag_id == tag_id,
                Channel.is_enabled == True,
                Channel.stock > 0,
                Channel.status == "normal",
            )
            .order_by(
                is_stale.desc(),
                never_dispensed.desc(),
                effective_date.asc(),
                Channel.last_dispense_at.is_(None).desc(),
                Channel.last_dispense_at.asc(),
            )
            .all()
        )

    def create_channel(self, channel_create: ChannelCreate) -> Channel:
        db_channel = Channel(
            machine_id=channel_create.machine_id,
            channel_code=channel_create.channel_code,
            tag_id=channel_create.tag_id,
            stock=channel_create.stock,
            max_stock=channel_create.max_stock,
            is_enabled=channel_create.is_enabled,
            status="normal",
        )
        self.db.add(db_channel)
        self.db.commit()
        self.db.refresh(db_channel)
        return db_channel

    def update_channel(self, channel_id: int, channel_update: ChannelUpdate) -> Optional[Channel]:
        db_channel = self.get_channel(channel_id)
        if not db_channel:
            return None

        update_data = channel_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_channel, key, value)

        self.db.commit()
        self.db.refresh(db_channel)
        return db_channel

    def delete_channel(self, channel_id: int) -> bool:
        db_channel = self.get_channel(channel_id)
        if not db_channel:
            return False

        self.db.delete(db_channel)
        self.db.commit()
        return True

    def add_stock(self, channel_id: int, quantity: int) -> Optional[Channel]:
        db_channel = self.get_channel(channel_id)
        if not db_channel:
            return None

        prev_stock = db_channel.stock
        new_stock = min(db_channel.stock + quantity, db_channel.max_stock)
        db_channel.stock = new_stock
        db_channel.status = "normal"

        if prev_stock == 0 and new_stock > 0:
            db_channel.stock_in_at = datetime.now()

        self.db.commit()
        self.db.refresh(db_channel)
        return db_channel

    def reduce_stock(self, channel_id: int, quantity: int) -> Optional[Channel]:
        db_channel = self.get_channel(channel_id)
        if not db_channel:
            return None

        if db_channel.stock < quantity:
            return None

        db_channel.stock -= quantity
        db_channel.last_dispense_at = datetime.now()

        self.db.commit()
        self.db.refresh(db_channel)
        return db_channel

    def get_total_stock_by_tag(self, machine_id: int, tag_id: int) -> int:
        channels = self.list_available_channels_by_tag(machine_id, tag_id)
        return sum(channel.stock for channel in channels)

    def batch_create_channels(self, machine_id: int, count: int, start_code: int = 1) -> List[Channel]:
        channels = []
        for i in range(count):
            code = f"A{start_code + i:03d}"
            channel = Channel(
                machine_id=machine_id,
                channel_code=code,
                stock=0,
                max_stock=10,
                is_enabled=True,
                status="normal",
            )
            self.db.add(channel)
            channels.append(channel)

        self.db.commit()
        for channel in channels:
            self.db.refresh(channel)
        return channels
