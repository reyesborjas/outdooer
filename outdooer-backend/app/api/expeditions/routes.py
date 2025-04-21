from flask import Blueprint, request, jsonify
from app import db
from app.models.expedition import Expedition  # Modelo a crear
from datetime import datetime
from models.expedition import Expedition
from flask import jsonify, request, Blueprint
from fastapi import APIRouter, HTTPException
from app.models.expedition import Expedition  # Asegúrate de que este import esté bien
from app import db  # O tu instancia de sesión SQLAlchemy
from fastapi.responses import JSONResponse
from fastapi import APIRouter

router = APIRouter(
    prefix="/api/expeditions",
    tags=["Expeditions"]
)



expedition_bp = Blueprint('expedition', __name__)

@expedition_bp.route('/expeditions', methods=['GET'])
def get_all_expeditions():
    expeditions = Expedition.query.all()
    return jsonify([exp.to_dict() for exp in expeditions]), 200


@expedition_bp.route('/expeditions/<int:expedition_id>', methods=['GET'])
def get_expedition(expedition_id):
    expedition = Expedition.query.get_or_404(expedition_id)
    return jsonify(expedition.to_dict()), 200


@expedition_bp.route('/expeditions', methods=['POST'])
def create_expedition():
    data = request.json
    expedition = Expedition(
        team_id=data.get('team_id'),
        title=data['title'],
        description=data['description'],
        start_date=datetime.fromisoformat(data['start_date']),
        end_date=datetime.fromisoformat(data['end_date']),
        min_participants=data.get('min_participants', 1),
        max_participants=data['max_participants'],
        price=data['price'],
        created_by=data['created_by'],
        leader_id=data.get('leader_id'),
    )
    db.session.add(expedition)
    db.session.commit()
    return jsonify(expedition.to_dict()), 201


@expedition_bp.route('/expeditions/<int:expedition_id>', methods=['PUT'])
def update_expedition(expedition_id):
    expedition = Expedition.query.get_or_404(expedition_id)
    data = request.json

    expedition.title = data.get('title', expedition.title)
    expedition.description = data.get('description', expedition.description)
    expedition.start_date = datetime.fromisoformat(data.get('start_date', expedition.start_date.isoformat()))
    expedition.end_date = datetime.fromisoformat(data.get('end_date', expedition.end_date.isoformat()))
    expedition.min_participants = data.get('min_participants', expedition.min_participants)
    expedition.max_participants = data.get('max_participants', expedition.max_participants)
    expedition.price = data.get('price', expedition.price)
    expedition.leader_id = data.get('leader_id', expedition.leader_id)
    expedition.expedition_status = data.get('expedition_status', expedition.expedition_status)

    db.session.commit()
    return jsonify(expedition.to_dict()), 200


@expedition_bp.route('/expeditions/<int:expedition_id>', methods=['DELETE'])
def delete_expedition(expedition_id):
    expedition = Expedition.query.get_or_404(expedition_id)
    db.session.delete(expedition)
    db.session.commit()
    return jsonify({"message": "Expedition deleted successfully"}), 200

@expedition_bp.route('/api/expeditions/led-by/<int:leader_id>', methods=['GET'])
def get_expeditions_by_leader(leader_id):
    expeditions = Expedition.query.filter_by(leader_id=leader_id).all()
    return jsonify([e.to_dict() for e in expeditions]), 200

@router.options("/led-by/{leader_id}")
def options_expeditions_led_by(leader_id: int):
    expeditions = db.session.query(Expedition).filter_by(leader_id=leader_id).all()
    if not expeditions:
        return JSONResponse(status_code=204, content={"message": "No expeditions found"})

    return JSONResponse(content={
        "expedition_ids": [e.expedition_id for e in expeditions],
        "count": len(expeditions)
    })