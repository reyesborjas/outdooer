# app/models/__init__.py


# 1. First, import the most basic models with no dependencies
from app.models.location import Location
from app.models.activity_type import ActivityType

# 2. Import User model next as many models depend on it
from app.models.user import User, UserRole  # Both imported together

# 3. Then import the Team model which depends on User
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.team_role_configuration import TeamRoleConfiguration

# 4. Import models that depend on multiple base models
from app.models.location import LocationAlias
from app.models.invitation import InvitationCode, InvitationUsage

# 5. Import models that depend on User, Location, and Team
from app.models.resource import ResourceCategory, Resource
from app.models.activity import Activity

# 6. Import models that depend on Activity
from app.models.resource import ActivityResource
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate

# 7. Import higher-level models with many dependencies
from app.models.expedition import Expedition, ExpeditionActivity, ExpeditionLocation, ExpeditionResource, ExpeditionRoute

# Import all models to make them accessible from models package
from app.models.team_member import TeamMember
from app.models.team_role_configuration import TeamRoleConfiguration
from app.models.expedition import Expedition
from app.models.activity import Activity