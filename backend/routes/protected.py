# routes/protected.py
from fastapi import APIRouter, Depends
from middlewares.auth import AuthUser, get_current_user

router = APIRouter(prefix="/api")

@router.get("/me")
async def me(user: AuthUser = Depends(get_current_user)):
    # user.raw contains full payload from Supabase
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "raw": user.raw
    }

@router.get("/admin-only")
async def admin_only(user: AuthUser = Depends(get_current_user)):
    # simple role check
    if user.role != "admin":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    return {"message": "Welcome admin", "user": user.id}
