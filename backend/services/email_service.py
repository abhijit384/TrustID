import os
import smtplib
import ssl
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

logger = logging.getLogger("trustid.email")

def send_otp_email(recipient_email: str, otp_code: str, user_name: str = "User") -> Dict[str, Any]:
    """
    Real-Time Security OTP Email Dispatcher.
    Attempts live SMTP dispatch if SMTP settings are present in .env.
    Gracefully logs and provides dev verification preview if SMTP credentials are pending.
    """
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@trustid.ai")

    subject = f"Your TRUSTID Security Verification Code: {otp_code}"
    
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #080c14; color: #f1f5f9; margin: 0; padding: 20px; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }}
    .header {{ text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b; }}
    .logo {{ color: #06b6d4; font-size: 24px; font-weight: 800; letter-spacing: 2px; }}
    .badge {{ display: inline-block; background: rgba(6, 182, 212, 0.15); color: #22d3ee; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-family: monospace; font-weight: 600; margin-top: 8px; }}
    .content {{ padding: 24px 0; text-align: center; }}
    .otp-box {{ background: #080c14; border: 1px dashed #06b6d4; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 20px 0; }}
    .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace; }}
    .footer {{ border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TRUSTID</div>
      <div class="badge">SECURE IDENTITY SCREENING</div>
    </div>
    <div class="content">
      <h2 style="color: #ffffff; margin-top: 0;">Identity Verification OTP</h2>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Hello {user_name},<br>
        Please enter the one-time password below to verify your email address and activate your TRUSTID workspace account.
      </p>
      <div class="otp-box">
        <span class="otp-code">{otp_code}</span>
      </div>
      <p style="color: #e2e8f0; font-size: 12px;">
        ⏱️ This security code is valid for <strong>10 minutes</strong>.
      </p>
      <p style="color: #ef4444; font-size: 11px;">
        ⚠️ Never share this code with anyone. TRUSTID security officers will never ask for your code.
      </p>
    </div>
    <div class="footer">
      Automated message sent by TRUSTID Multimodal AI Security Engine.<br>
      © 2026 TRUSTID AI. All rights reserved.
    </div>
  </div>
</body>
</html>
"""

    text_body = f"""TRUSTID Security Verification Code
Hello {user_name},

Your security verification code is: {otp_code}

This code is valid for 10 minutes. Do not share this code with anyone.
"""

    # Always log clearly in the backend output
    print(f"\n=======================================================")
    print(f"[TRUSTID REAL-TIME EMAIL OTP DISPATCH]")
    print(f"Recipient : {recipient_email}")
    print(f"User Name : {user_name}")
    print(f"OTP Code  : {otp_code}")
    print(f"Validity  : 10 minutes")
    print(f"=======================================================\n")

    # If live SMTP host is specified in environment, attempt socket delivery
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = recipient_email

            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            msg.attach(part1)
            msg.attach(part2)

            if smtp_port == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=10) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, recipient_email, msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.starttls(context=ssl.create_default_context())
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, recipient_email, msg.as_string())

            logger.info(f"Live SMTP email sent successfully to {recipient_email}")
            return {
                "delivered": True,
                "method": "smtp_live",
                "message": f"Verification code delivered to {recipient_email}."
            }
        except Exception as e:
            logger.error(f"Live SMTP delivery failed: {e}. Falling back to terminal log.")
            return {
                "delivered": False,
                "method": "smtp_failed_fallback_console",
                "error": str(e),
                "preview_otp": otp_code,
                "message": f"Security OTP generated. Code: {otp_code} (SMTP note: {e})"
            }

    # Dev/demo fallback when SMTP is not configured in .env
    return {
        "delivered": False,
        "method": "console_preview",
        "preview_otp": otp_code,
        "message": f"Real-time verification OTP generated and dispatched for {recipient_email}."
    }
