import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM


def send_verification_email(to_email: str, full_name: str, code: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Votre code de vérification — Daisy Consulting Agents"
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email

    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Bonjour {full_name},</h2>
      <p>Voici votre code de vérification :</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c5cff; text-align: center; padding: 20px; background: #f5f3ff; border-radius: 12px; margin: 20px 0;">
        {code}
      </div>
      <p>Saisissez ce code sur la page de vérification pour activer votre compte.</p>
      <p style="margin-top:20px; font-size:12px; color:#888;">
        Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
      </p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(EMAIL_FROM, to_email, msg.as_string())



        
def send_password_reset_email(to_email: str, full_name: str, code: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Réinitialisation de votre mot de passe — Daisy Consulting Agents"
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email

    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Bonjour {full_name},</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code :</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c5cff; text-align: center; padding: 20px; background: #f5f3ff; border-radius: 12px; margin: 20px 0;">
        {code}
      </div>
      <p>Saisissez ce code sur la page de réinitialisation pour choisir un nouveau mot de passe.</p>
      <p style="margin-top:20px; font-size:12px; color:#888;">
        Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe actuel reste inchangé.
      </p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(EMAIL_FROM, to_email, msg.as_string())