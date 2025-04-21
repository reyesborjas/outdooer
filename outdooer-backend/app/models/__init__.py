# app/models/__init__.py

# Importar modelos para asegurarse de que todos están registrados
# antes de que se establezcan las relaciones

# Modelos base
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember, TeamRoleConfiguration
from app.models.location import Location, LocationAlias
from app.models.activity_type import ActivityType

# Modelos dependientes
from app.models.activity import Activity
from app.models.invitation import InvitationCode, InvitationUsage

# Otros modelos según los necesites
# from app.models.expedition import Expedition
# from app.models.reservation import Reservation
# etc.