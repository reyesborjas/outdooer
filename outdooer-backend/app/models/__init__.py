# app/models/__init__.py

"""
Este archivo garantiza el orden correcto de importación de los modelos
para evitar problemas de dependencias circulares en SQLAlchemy y Marshmallow.
"""

# 1. Primero importamos los modelos base sin dependencias circulares
from app.models.user import User
from app.models.location import Location
from app.models.activity_type import ActivityType

# 2. Luego importamos los modelos que dependen de los básicos
from app.models.user import UserRole  # Depende de User
from app.models.team import Team  # Depende de User

# 3. Importamos componentes que dependen de múltiples modelos base
from app.models.team import TeamMember, TeamRoleConfiguration  # Dependen de Team y User
from app.models.location import LocationAlias  # Depende de Location
from app.models.invitation import InvitationCode, InvitationUsage  # Depende de User y Team

# 4. Modelos de nivel superior con dependencias en modelos anteriores
from app.models.resource import ResourceCategory, Resource
from app.models.activity import Activity  # Depende de User, Location, Team, ActivityType

# 5. Modelos con dependencias en Activity
from app.models.resource import ActivityResource  # Depende de Activity
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate  # Depende de Activity

# 6. Modelos de más alto nivel con múltiples dependencias
from app.models.expedition import Expedition
from app.models.expedition import ExpeditionActivity, ExpeditionLocation, ExpeditionResource, ExpeditionRoute