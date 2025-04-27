# app/models/__init__.py

# Import User model first as many models depend on it
from app.models.user import User, UserRole

# Import Team models before team-dependent models
from app.models.team import Team, TeamRevenueSharing, TeamMetrics, TeamMicrosites
from app.models.team_member import TeamMember
from app.models.team_role_configuration import TeamRoleConfiguration
from app.models.team_role_permissions import TeamRolePermissions

# Import location-related models
from app.models.location import Location, LocationAlias

# Import invitation models
from app.models.invitation import InvitationCode, InvitationUsage

# Import activity types
from app.models.activity_type import ActivityType

# Import resource models
from app.models.resource import ResourceCategory, Resource, ActivityResource

# Import activity models
from app.models.activity import Activity
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate

# Import expedition models
from app.models.expedition import Expedition, ExpeditionActivity, ExpeditionLocation, ExpeditionResource, ExpeditionRoute

# Import audit models
from app.models.audit_log import TeamSettingsAuditLog