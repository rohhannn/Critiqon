from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: str
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str
    new_password: str