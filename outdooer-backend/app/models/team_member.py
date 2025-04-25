# models/team_member.py
from app.database import db

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    role_level = db.Column(db.Integer, nullable=False)  # 1=Master, 2=Tactical, 3=Technical, 4=Base
    join_date = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relationships
    user = db.relationship('User', back_populates='team_memberships')
    team = db.relationship('Team', back_populates='members')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'team_id': self.team_id,
            'role_level': self.role_level,
            'join_date': self.join_date.isoformat() if self.join_date else None
        }

# models/team_role_configuration.py
from app.database import db

class TeamRoleConfiguration(db.Model):
    __tablename__ = 'team_role_configurations'
    
    id = db.Column(db.Integer, primary_key=True)
    role_level = db.Column(db.Integer, nullable=False)  # 1=Master, 2=Tactical, 3=Technical, 4=Base
    operation = db.Column(db.String(50), nullable=False)  # e.g., 'create_expedition', 'delete_activity'
    is_permitted = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'role_level': self.role_level,
            'operation': self.operation,
            'is_permitted': self.is_permitted
        }

# models/team.py
from app.database import db

class Team(db.Model):
    __tablename__ = 'teams'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    master_guide_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    members = db.relationship('TeamMember', back_populates='team')
    expeditions = db.relationship('Expedition', back_populates='team')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'master_guide_id': self.master_guide_id
        }