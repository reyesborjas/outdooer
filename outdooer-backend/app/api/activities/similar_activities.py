# app/api/activities/similar_activities.py
from flask import jsonify, request
from app.models.activity import Activity

def find_similar_activities(team_id, activity_type_id, location_id, exclude_activity_id=None):
    """
    Encuentra actividades con el mismo tipo, equipo y ubicación
    
    Parámetros:
    - team_id: ID del equipo
    - activity_type_id: ID del tipo de actividad
    - location_id: ID de la ubicación
    - exclude_activity_id: ID de actividad a excluir (opcional, para edición)
    
    Retorna:
    - Lista de actividades similares
    """
    query = Activity.query.filter_by(
        team_id=team_id,
        activity_type_id=activity_type_id,
        location_id=location_id
    )
    
    if exclude_activity_id:
        query = query.filter(Activity.activity_id != exclude_activity_id)
    
    return query.all()

def check_similar_activities_endpoint():
    """Endpoint para verificar actividades similares basado en tipo y ubicación"""
    try:
        team_id = request.args.get('team_id', type=int)
        activity_type_id = request.args.get('activity_type_id', type=int)
        location_id = request.args.get('location_id', type=int)
        activity_id = request.args.get('activity_id', type=int)
        
        if None in [team_id, activity_type_id, location_id]:
            return jsonify({"error": "Missing required parameters"}), 400
        
        similar_activities = find_similar_activities(
            team_id, activity_type_id, location_id, activity_id
        )
        
        return jsonify({
            "has_similar": len(similar_activities) > 0,
            "similar_count": len(similar_activities),
            "similar_activities": [
                {
                    "activity_id": a.activity_id,
                    "title": a.title,
                    "difficulty_level": a.difficulty_level,
                    "price": float(a.price)
                } for a in similar_activities[:5]  # Limitar a 5 resultados
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500