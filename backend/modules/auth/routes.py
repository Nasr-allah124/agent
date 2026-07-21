from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import create_access_token, get_current_user_id
from modules.auth.schemas import (
    UserCreate, UserLogin, UserOut, VerifyCodeRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    TokenPair, RefreshRequest, LogoutRequest,
)
from modules.auth.service import (
    create_user, authenticate_user, verify_user_code, resend_verification_code,
    request_password_reset, reset_password,
    issue_tokens, refresh_access_token, revoke_refresh_token,
)
from core.rate_limit import verifier_limite
from modules.auth.models import User


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, data)


@router.post("/verify-email")
def verify_email(data: VerifyCodeRequest, db: Session = Depends(get_db)):
    verify_user_code(db, data.email, data.code)
    return {"message": "Email vérifié avec succès."}


@router.post("/resend-code")
def resend_code(data: dict, db: Session = Depends(get_db)):
    resend_verification_code(db, data["email"])
    return {"message": "Nouveau code envoyé."}


@router.post("/login", response_model=TokenPair)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    return issue_tokens(db, user)


@router.get("/me", response_model=UserOut)
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return user

from fastapi import Request

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "inconnu"
    email = data.email.lower()

    if not verifier_limite(f"forgot-password:email:{email}", max_tentatives=3, fenetre_secondes=900):
        raise HTTPException(status_code=429, detail="Trop de tentatives pour cet email. Réessayez dans quelques minutes.")
    if not verifier_limite(f"forgot-password:ip:{ip}", max_tentatives=10, fenetre_secondes=900):
        raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans quelques minutes.")

    request_password_reset(db, data.email)
    return {"message": "Si un compte existe avec cet email, un code de réinitialisation a été envoyé."}


@router.post("/reset-password")
def reset_password_route(data: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not verifier_limite(f"reset-password:email:{data.email.lower()}", max_tentatives=5, fenetre_secondes=900):
        raise HTTPException(status_code=429, detail="Trop de tentatives. Demandez un nouveau code.")
    reset_password(db, data.email, data.code, data.new_password)
    return {"message": "Mot de passe réinitialisé avec succès."}


@router.post("/refresh", response_model=TokenPair)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(db, data.refresh_token)


@router.post("/logout")
def logout(data: LogoutRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(db, data.refresh_token)
    return {"message": "Déconnecté."}

