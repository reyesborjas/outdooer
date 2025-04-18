from flask import Flask
from config import config  # Tu archivo de configuración

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # Aquí importas tus blueprints, extensiones, etc.
    return app
