from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    channel_code = Column(String(50), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=True)
    stock = Column(Integer, default=0)
    max_stock = Column(Integer, default=10)
    is_enabled = Column(Boolean, default=True)
    status = Column(String(20), default="normal")
    last_dispense_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    machine = relationship("Machine", back_populates="channels")
    tag = relationship("Tag")
