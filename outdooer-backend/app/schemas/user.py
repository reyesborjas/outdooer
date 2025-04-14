from app import ma
from app.models.user import User

class UserSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User
        
    user_id = ma.auto_field()
    email = ma.auto_field()
    first_name = ma.auto_field()
    last_name = ma.auto_field()
    date_of_birth = ma.auto_field()
    profile_image_url = ma.auto_field()
    
    # Don't include password_hash in serialization