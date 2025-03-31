# app/services/auth_service.py
from app import db
from app.models.user import User
from app.utils.security import generate_password_hash, verify_password
from flask_jwt_extended import create_access_token, create_refresh_token

class AuthService:
    """Service for authentication-related operations"""
    
    @staticmethod
    def login(email, password):
        """Authenticate a user and generate access tokens"""
        user = User.query.filter_by(email=email).first()
        
        if not user or not verify_password(user.password_hash, password):
            return None, "Invalid email or password"
        
        # Create tokens
        access_token = create_access_token(identity=user.user_id)
        refresh_token = create_refresh_token(identity=user.user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_id": user.user_id
        }, None
    
    @staticmethod
    def register(email, password, first_name, last_name, date_of_birth):
        """Register a new user"""
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return None, "Email already registered"
        
        # Create new user
        new_user = User(
            email=email,
            password_hash=generate_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            account_status='active'
        )
        
        try:
            db.session.add(new_user)
            db.session.commit()
            
            # Create tokens for the new user
            access_token = create_access_token(identity=new_user.user_id)
            refresh_token = create_refresh_token(identity=new_user.user_id)
            
            return {
                "user_id": new_user.user_id,
                "access_token": access_token,
                "refresh_token": refresh_token
            }, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)