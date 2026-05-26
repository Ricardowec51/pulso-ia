#!/usr/bin/env python3
"""
Envía PULSO a la IA Edición 23 por Gmail SMTP.
Solicita el App Password de forma segura (no queda en ningún archivo).
"""

import smtplib, getpass
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders

EDITION   = 21
FROM_ADDR = "ricardowec@gmail.com"
TO_ADDR   = "ricardowec@gmail.com"
DOCX_PATH = Path(__file__).resolve().parent / "output" / f"PULSO_a_la_IA_Edicion_{EDITION}.docx"

SUBJECT = f"PULSO a la IA — Edición {EDITION} | 24/05/2026"

BODY = f"""\
Estimado/a,

Adjunto encontrará la Edición {EDITION} de PULSO a la IA, su resumen semanal de tendencias \
en Inteligencia Artificial para el sector ejecutivo.

📌 Esta edición incluye:
• AIFI26 Buenos Aires: la banca latinoamericana entra en la era agéntica
• Ecuador aprueba Estrategia Nacional IA 2025-2029 y avanza hacia Ley Orgánica
• Alteryx lanza Agent Studio + MCP Server: los analistas construyen los agentes
• Gemini 3.5 Flash y el ranking de modelos mayo 2026
• Veredicto accionable con 5 recomendaciones concretas

📩 Suscríbete: https://emprendedores.ec/suscripcion

—
Ricardo Wagner-Areco
EMPRENDEDORES.LTD | emprendedores.ec
"""

def main():
    print(f"\n📧  PULSO a la IA — Edición {EDITION}")
    print(f"    De:   {FROM_ADDR}")
    print(f"    Para: {TO_ADDR}")
    print(f"    Adj:  {DOCX_PATH.name}\n")

    import os
    app_password = os.environ.get("GMAIL_APP_PASS", "").replace(" ", "")
    if not app_password:
        app_password = input("🔑  App Password de Gmail (16 chars): ").replace(" ", "")

    if len(app_password) != 16:
        print(f"⚠️  El App Password debe tener 16 caracteres (tienes {len(app_password)}). Verifica y vuelve a intentar.")
        return

    msg = MIMEMultipart()
    msg["From"]    = FROM_ADDR
    msg["To"]      = TO_ADDR
    msg["Subject"] = SUBJECT
    msg.attach(MIMEText(BODY, "plain", "utf-8"))

    with open(DOCX_PATH, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f'attachment; filename="{DOCX_PATH.name}"')
    msg.attach(part)

    print("\n⏳  Conectando con smtp.gmail.com:587 ...")
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.login(FROM_ADDR, app_password)
            server.sendmail(FROM_ADDR, TO_ADDR, msg.as_string())
        print(f"\n✅  Email enviado correctamente a {TO_ADDR}")
        print(f"    Asunto: {SUBJECT}")
    except smtplib.SMTPAuthenticationError:
        print("\n❌  Error de autenticación. Verifica que:")
        print("    1. La verificación en 2 pasos esté activa en tu cuenta Google")
        print("    2. Estés usando un App Password (no tu contraseña normal)")
        print("    3. El App Password sea correcto y sin espacios")
    except Exception as e:
        print(f"\n❌  Error al enviar: {e}")

if __name__ == "__main__":
    main()
