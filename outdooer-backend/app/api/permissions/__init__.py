from flask import Blueprint
permissions_bp = Blueprint('permissions', __name__, url_prefix='/api/permissions')
from . import routes