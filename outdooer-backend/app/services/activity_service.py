# app/models/activity.py or app/services/activity_service.py
from app.models.activity import Activity
def find_similar_activities(team_id, activity_type_id, location_id, exclude_activity_id=None):
    """
    Find activities with the same activity_type, team, and location
    
    Parameters:
    - team_id: ID of the team
    - activity_type_id: ID of the activity type
    - location_id: ID of the location
    - exclude_activity_id: Optional ID to exclude from results (for editing)
    
    Returns:
    - List of similar activities
    """
    query = Activity.query.filter_by(
        team_id=team_id,
        activity_type_id=activity_type_id,
        location_id=location_id
    )
    
    if exclude_activity_id:
        query = query.filter(Activity.activity_id != exclude_activity_id)
    
    return query.all()