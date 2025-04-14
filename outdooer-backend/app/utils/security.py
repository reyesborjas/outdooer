# app/utils/security.py
from werkzeug.security import generate_password_hash as werkzeug_generator
from werkzeug.security import check_password_hash

def generate_password_hash(password):
    """Generate a secure hash of the password"""
    return werkzeug_generator(password)

def verify_password(password_hash, password):
    """Verify that the password matches the hash"""
    return check_password_hash(password_hash, password)