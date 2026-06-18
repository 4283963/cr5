from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate


class TagService:
    def __init__(self, db: Session):
        self.db = db

    def get_tag(self, tag_id: int) -> Optional[Tag]:
        return self.db.query(Tag).filter(Tag.id == tag_id).first()

    def get_tag_by_name(self, name: str) -> Optional[Tag]:
        return self.db.query(Tag).filter(Tag.name == name).first()

    def list_tags(self, skip: int = 0, limit: int = 100) -> List[Tag]:
        return self.db.query(Tag).offset(skip).limit(limit).all()

    def create_tag(self, tag_create: TagCreate) -> Tag:
        db_tag = Tag(
            name=tag_create.name,
            description=tag_create.description,
            color=tag_create.color,
        )
        self.db.add(db_tag)
        self.db.commit()
        self.db.refresh(db_tag)
        return db_tag

    def update_tag(self, tag_id: int, tag_update: TagUpdate) -> Optional[Tag]:
        db_tag = self.get_tag(tag_id)
        if not db_tag:
            return None

        update_data = tag_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_tag, key, value)

        self.db.commit()
        self.db.refresh(db_tag)
        return db_tag

    def delete_tag(self, tag_id: int) -> bool:
        db_tag = self.get_tag(tag_id)
        if not db_tag:
            return False

        self.db.delete(db_tag)
        self.db.commit()
        return True
