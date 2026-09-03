from pydantic import BaseModel, EmailStr


# =========================================================
# USER REGISTRATION
# =========================================================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


# =========================================================
# PASSWORD LOGIN
# =========================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


# =========================================================
# PROFILE
# =========================================================

class ProfileUpdate(BaseModel):
    full_name: str
    email: EmailStr


# =========================================================
# PASSWORD CHANGE
# =========================================================

class PasswordChange(BaseModel):
    current_password: str
    new_password: str