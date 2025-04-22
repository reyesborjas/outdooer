# app/models/__init__.py

"""
Este archivo garantiza el orden correcto de importación de los modelos
para evitar problemas de dependencias circulares en SQLAlchemy y Marshmallow.
"""

# 1. Primero importamos los modelos base sin dependencias
from app.models.user import User, UserRole
from app.models.location import Location, LocationAlias
from app.models.activity_type import ActivityType

# 2. Luego importamos los modelos que dependen de los básicos pero que no son dependidos por ellos
from app.models.user import UserRole  # Depende de User
from app.models.team import Team, TeamMember, TeamRoleConfiguration  # Depende de User

# 3. Luego importamos los modelos que tienen dependencias más complejas
from app.models.team import TeamMember, TeamRoleConfiguration  # Dependen de Team y User
from app.models.location import LocationAlias  # Depende de Location
from app.models.invitation import InvitationCode, InvitationUsage  # Depende de InvitationCode y User

# 4. Por último importamos modelos que dependen de múltiples modelos anteriores
from app.models.activity import Activity  # Depende de User, Location, Team
from app.models.expedition import Expedition, ExpeditionActivity, ExpeditionLocation, ExpeditionResource, ExpeditionRoute  # Depende de User, Team, Activity

# 5. Modelos adicionales con dependencias complejas
from app.models.resource import ResourceCategory, Resource, ActivityResource
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate

# 6. Modelos de relaciones muchos a muchos
try:
    from app.models.expedition import ExpeditionActivity, ExpeditionLocation, ExpeditionResource, ExpeditionRoute
except ImportError:
    # En caso de que estos modelos no existan todavía
    pass