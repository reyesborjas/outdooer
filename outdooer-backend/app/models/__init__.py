# app/models/__init__.py

# 1. First, import the most basic models with no dependencies
from app.models.location import Location
from app.models.activity_type import ActivityType

# 2. Import User model next as many models depend on it
from app.models.user import User, UserRole  # Both imported together

# 3. Import the Team-related models
from app.models.team import Team, TeamRevenueSharing, TeamMetrics, TeamMicrosites

# 4. Import the team_role_configurations model
from app.models.team_role_configuration import TeamRoleConfiguration

# 5. Import team member models that depend on team and user
from app.models.team_member import TeamMember

# 6. Import global role permissions model
from app.models.global_role_permissions import GlobalRolePermission

# 7. Import team role permissions model (if you have a separate model)
from app.models.team_role_permissions import TeamRolePermissions

# 8. Import models that depend on multiple base models
from app.models.location import LocationAlias
from app.models.invitation import InvitationCode, InvitationUsage

# 9. Import models that depend on User, Location, and Team
from app.models.resource import ResourceCategory, Resource
from app.models.activity import Activity

# 10. Import models that depend on Activity
from app.models.resource import ActivityResource
from app.models.activity_date import GuideActivityInstance, ActivityAvailableDate

# 11. Import higher-level models with many dependencies
from app.models.expedition import Expedition, ExpeditionActivity, ExpeditionLocation, ExpeditionResource, ExpeditionRoute

# 12. Import audit models
from app.models.audit_log import TeamSettingsAuditLog