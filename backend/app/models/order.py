from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(50), default="")
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    status = Column(String(20), default="pending")
    total_quantity = Column(Integer, default=0)
    remark = Column(String(200), default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    machine = relationship("Machine")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=True)
    quantity = Column(Integer, default=1)
    status = Column(String(20), default="pending")
    dispensed_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="items")
    tag = relationship("Tag")
    channel = relationship("Channel")
