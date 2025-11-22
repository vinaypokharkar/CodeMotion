# controllers/auth_controller.py
# Example controller that receives AuthUser and performs business logic
from typing import Dict
from middlewares.auth import AuthUser

def get_profile_payload(user: AuthUser) -> Dict:
    # create a stable profile payload for frontend
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        # surface only what you want
    }
