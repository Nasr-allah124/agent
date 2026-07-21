from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from modules.auth.models import User
from modules.auth.schemas import UserCreate
from core.security import hash_password, verify_password, generate_verification_code
from core.email import send_verification_email
from core.config import REFRESH_TOKEN_EXPIRE_DAYS
from core.security import create_access_token, generate_refresh_token, hash_token
from modules.auth.models import RefreshToken


def create_user(db: Session, data: UserCreate) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    code = generate_verification_code()
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=f"{data.first_name} {data.last_name}",
        company=data.company,
        role=data.role,
        is_verified=False,
        verification_token=code,
        verification_token_expires=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    send_verification_email(user.email, user.full_name, code)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Veuillez vérifier votre email avant de vous connecter.")
    return user


def verify_user_code(db: Session, email: str, code: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Utilisateur introuvable.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Ce compte est déjà vérifié.")
    if user.verification_token != code:
        raise HTTPException(status_code=400, detail="Code de vérification incorrect.")
    if user.verification_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Ce code a expiré, demandez-en un nouveau.")

    user.is_verified = True
    user.verification_token = None
    db.commit()
    return user


def resend_verification_code(db: Session, email: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Utilisateur introuvable.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Ce compte est déjà vérifié.")

    code = generate_verification_code()
    user.verification_token = code
    user.verification_token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    send_verification_email(user.email, user.full_name, code)

# import smtplib
# from email.mime.text import MIMEText

# SMTP_USER = "claudeme80@gmail.com"
# SMTP_PASSWORD = "tweo uchn yudp rwzy"

# msg = MIMEText("Test d'envoi")
# msg["Subject"] = "Test"
# msg["From"] = SMTP_USER
# msg["To"] = SMTP_USER

# with smtplib.SMTP("smtp.gmail.com", 587) as server:
#     server.starttls()
#     server.login(SMTP_USER, SMTP_PASSWORD)
#     server.sendmail(SMTP_USER, SMTP_USER, msg.as_string())

# print("Email envoyé !")
from core.email import send_password_reset_email


def request_password_reset(db: Session, email: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Ne jamais révéler si l'email existe ou non (évite l'énumération de comptes)
        return

    code = generate_verification_code()
    user.verification_token = code
    user.verification_token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    send_password_reset_email(user.email, user.full_name, code)


def reset_password(db: Session, email: str, code: str, new_password: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")
    if user.verification_token != code:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")
    if user.verification_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")

    user.password_hash = hash_password(new_password)
    user.verification_token = None
    user.verification_token_expires = None

    # Révoque toutes les sessions actives : un changement de mot de passe
    # doit déconnecter tout le monde, y compris un éventuel attaquant.
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": datetime.now(timezone.utc)})

    db.commit()

def issue_tokens(db: Session, user: User) -> dict:
    access_token = create_access_token(str(user.id))
    raw_refresh = generate_refresh_token()
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    db.commit()
    return {"access_token": access_token, "refresh_token": raw_refresh}


def refresh_access_token(db: Session, raw_refresh_token: str) -> dict:
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(raw_refresh_token)).first()
    if not record or record.revoked_at is not None or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expirée, veuillez vous reconnecter.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Session expirée, veuillez vous reconnecter.")

    # Rotation : l'ancien refresh token est révoqué, un nouveau couple est émis
    record.revoked_at = datetime.now(timezone.utc)
    return issue_tokens(db, user)


def revoke_refresh_token(db: Session, raw_refresh_token: str) -> None:
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(raw_refresh_token)).first()
    if record and record.revoked_at is None:
        record.revoked_at = datetime.now(timezone.utc)
        db.commit()