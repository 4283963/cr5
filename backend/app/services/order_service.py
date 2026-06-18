import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.machine import Machine
from app.schemas.order import OrderCreate, OrderUpdate, DispenseResult
from app.services.channel_service import ChannelService
from app.services.device_communication import device_simulator


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.channel_service = ChannelService(db)

    def get_order(self, order_id: int) -> Optional[Order]:
        return self.db.query(Order).filter(Order.id == order_id).first()

    def get_order_by_no(self, order_no: str) -> Optional[Order]:
        return self.db.query(Order).filter(Order.order_no == order_no).first()

    def list_orders(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        machine_id: Optional[int] = None,
    ) -> List[Order]:
        query = self.db.query(Order)

        if status:
            query = query.filter(Order.status == status)
        if machine_id:
            query = query.filter(Order.machine_id == machine_id)

        return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    def _generate_order_no(self) -> str:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_str = uuid.uuid4().hex[:6].upper()
        return f"BK{timestamp}{random_str}"

    def create_order(self, order_create: OrderCreate) -> Order:
        order_no = self._generate_order_no()

        total_quantity = sum(item.quantity for item in order_create.items)

        db_order = Order(
            order_no=order_no,
            user_id=order_create.user_id,
            machine_id=order_create.machine_id,
            status="pending",
            total_quantity=total_quantity,
            remark=order_create.remark,
        )
        self.db.add(db_order)
        self.db.flush()

        for item in order_create.items:
            db_item = OrderItem(
                order_id=db_order.id,
                tag_id=item.tag_id,
                quantity=item.quantity,
                status="pending",
            )
            self.db.add(db_item)

        self.db.commit()
        self.db.refresh(db_order)
        return db_order

    def update_order(self, order_id: int, order_update: OrderUpdate) -> Optional[Order]:
        db_order = self.get_order(order_id)
        if not db_order:
            return None

        update_data = order_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_order, key, value)

        self.db.commit()
        self.db.refresh(db_order)
        return db_order

    def _allocate_channels(self, order: Order) -> bool:
        for item in order.items:
            channels = self.channel_service.list_available_channels_by_tag(
                order.machine_id, item.tag_id
            )

            if not channels:
                return False

            total_needed = item.quantity
            allocated = 0

            for channel in channels:
                if allocated >= total_needed:
                    break

                available = min(channel.stock, total_needed - allocated)
                if available > 0:
                    item.channel_id = channel.id
                    allocated += available

            if allocated < total_needed:
                return False

        return True

    async def dispense_order(self, order_id: int) -> Order:
        db_order = self.get_order(order_id)
        if not db_order:
            raise ValueError(f"订单 {order_id} 不存在")

        if db_order.status not in ("pending", "failed"):
            raise ValueError(f"订单 {db_order.order_no} 状态不允许出货")

        machine = self.db.query(Machine).filter(Machine.id == db_order.machine_id).first()
        if not machine:
            raise ValueError("机器不存在")

        if not machine.is_enabled:
            raise ValueError("机器已禁用")

        allocation_success = self._allocate_channels(db_order)
        if not allocation_success:
            db_order.status = "failed"
            for item in db_order.items:
                item.status = "failed"
            self.db.commit()
            self.db.refresh(db_order)
            return db_order

        db_order.status = "dispensing"
        self.db.commit()

        all_success = True
        for item in db_order.items:
            item.status = "dispensing"
            self.db.commit()

            if item.channel_id:
                channel = self.channel_service.get_channel(item.channel_id)
                if channel:
                    result = await device_simulator.send_dispense_command(
                        machine.code, channel.channel_code, item.quantity
                    )

                    if result.success:
                        self.channel_service.reduce_stock(channel.id, item.quantity)
                        item.status = "success"
                        item.dispensed_at = datetime.now()
                    else:
                        item.status = "failed"
                        all_success = False

            self.db.commit()

        db_order.status = "completed" if all_success else "partial"
        self.db.commit()
        self.db.refresh(db_order)

        return db_order

    def cancel_order(self, order_id: int) -> Optional[Order]:
        db_order = self.get_order(order_id)
        if not db_order:
            return None

        if db_order.status not in ("pending", "failed"):
            return None

        db_order.status = "cancelled"
        for item in db_order.items:
            if item.status == "pending":
                item.status = "cancelled"

        self.db.commit()
        self.db.refresh(db_order)
        return db_order

    def get_order_statistics(self, machine_id: Optional[int] = None) -> dict:
        query = self.db.query(Order)
        if machine_id:
            query = query.filter(Order.machine_id == machine_id)

        orders = query.all()

        stats = {
            "total": len(orders),
            "pending": 0,
            "dispensing": 0,
            "completed": 0,
            "failed": 0,
            "cancelled": 0,
            "partial": 0,
            "total_quantity": 0,
        }

        for order in orders:
            status = order.status
            if status in stats:
                stats[status] += 1
            stats["total_quantity"] += order.total_quantity

        return stats
