from app import db
from datetime import datetime


class Expedition(db.Model):
    __tablename__ = 'expeditions'

    expedition_id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    min_participants = db.Column(db.Integer, default=1)
    max_participants = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    leader_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expedition_status = db.Column(db.String(20), default='active')

    # Relaciones
    team = db.relationship('Team', back_populates='expeditions', lazy='joined')
    creator = db.relationship('User', foreign_keys=[created_by], back_populates='created_expeditions', lazy='joined')
    leader = db.relationship('User', foreign_keys=[leader_id], back_populates='led_expeditions', lazy='joined')

    expedition_activities = db.relationship('ExpeditionActivity', back_populates='expedition', cascade='all, delete-orphan')
    expedition_locations = db.relationship('ExpeditionLocation', back_populates='expedition', cascade='all, delete-orphan')
    expedition_resources = db.relationship('ExpeditionResource', back_populates='expedition', cascade='all, delete-orphan')
    expedition_route = db.relationship('ExpeditionRoute', back_populates='expedition', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "expedition_id": self.expedition_id,
            "team_id": self.team_id,
            "title": self.title,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "min_participants": self.min_participants,
            "max_participants": self.max_participants,
            "price": str(self.price),
            "created_by": self.created_by,
            "leader_id": self.leader_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "expedition_status": self.expedition_status,

            # Datos relacionados útiles
            "team_name": self.team.team_name if self.team else None,
            "leader_name": f"{self.leader.first_name} {self.leader.last_name}" if self.leader else None,
            "creator_name": f"{self.creator.first_name} {self.creator.last_name}" if self.creator else None,
        }
