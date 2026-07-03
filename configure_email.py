import os
import sys
import imaplib
import smtplib
from dotenv import load_dotenv

def test_imap_connection(server, port, user, password):
    print(f"Connecting to IMAP server {server}:{port}...")
    try:
        mail = imaplib.IMAP4_SSL(server, port)
        print("Authenticating with IMAP server...")
        mail.login(user, password)
        mail.logout()
        print("[SUCCESS] IMAP Connection and authentication successful!")
        return True
    except Exception as e:
        print(f"[FAILED] IMAP Connection failed: {e}")
        return False

def test_smtp_connection(server, port, user, password):
    print(f"Connecting to SMTP server {server}:{port}...")
    try:
        if port == 465:
            smtp = smtplib.SMTP_SSL(server, port, timeout=10)
        else:
            smtp = smtplib.SMTP(server, port, timeout=10)
            smtp.starttls()
        print("Authenticating with SMTP server...")
        smtp.login(user, password)
        smtp.quit()
        print("[SUCCESS] SMTP Connection and authentication successful!")
        return True
    except Exception as e:
        print(f"[FAILED] SMTP Connection failed: {e}")
        return False

def main():
    print("=" * 80)
    print("                TROFEO HARDWARE - LIVE EMAIL CONNECTION BUILDER")
    print("=" * 80)
    print("This utility will help you configure and test your live IMAP/SMTP credentials.")
    print("For Gmail accounts, you MUST use a Google App Password (not your main password).")
    print("Instructions to create a Gmail App Password:")
    print("  1. Go to your Google Account (myaccount.google.com).")
    print("  2. Search for 'App passwords' or navigate to Security -> 2-Step Verification -> App Passwords.")
    print("  3. Generate a new app password (select App='Other' and name it 'Trofeo SKU Matcher').")
    print("  4. Copy the 16-character code (without spaces) and use it as your password.")
    print("-" * 80)

    # Load existing env if any
    load_dotenv()
    
    default_email = os.environ.get("EMAIL_USER", "your_store_email@gmail.com")
    if default_email.startswith("your_"):
        default_email = ""
        
    email_user = input(f"Enter your Email Address [{default_email}]: ").strip()
    if not email_user:
        email_user = default_email
        
    if not email_user:
        print("[Error] Email address is required.")
        sys.exit(1)

    email_pass = input("Enter your App Password / Password (input hidden on display): ").strip()
    # If hidden input is needed, we can use getpass but standard input is fine too for clarity.
    if not email_pass:
        print("[Error] Password is required.")
        sys.exit(1)

    print("\nSelect email provider preset:")
    print("1. Gmail (imap.gmail.com:993 / smtp.gmail.com:465)")
    print("2. Outlook / Office 365 (outlook.office365.com:993 / smtp.office365.com:587)")
    print("3. Custom server settings")
    choice = input("Choose option [1]: ").strip()
    
    if choice == "2":
        imap_server = "outlook.office365.com"
        imap_port = 993
        smtp_server = "smtp.office365.com"
        smtp_port = 587
    elif choice == "3":
        imap_server = input("Enter IMAP Server (e.g. imap.mail.com): ").strip()
        imap_port = int(input("Enter IMAP Port [993]: ").strip() or "993")
        smtp_server = input("Enter SMTP Server (e.g. smtp.mail.com): ").strip()
        smtp_port = int(input("Enter SMTP Port [465]: ").strip() or "465")
    else:
        imap_server = "imap.gmail.com"
        imap_port = 993
        smtp_server = "smtp.gmail.com"
        smtp_port = 465

    print("\nVerifying credentials...")
    print("-" * 50)
    
    imap_ok = test_imap_connection(imap_server, imap_port, email_user, email_pass)
    smtp_ok = test_smtp_connection(smtp_server, smtp_port, email_user, email_pass)
    
    print("-" * 50)
    if imap_ok and smtp_ok:
        print("[SUCCESS] All email systems are working!")
        
        # Save to .env
        env_content = f"""# Trofeo Hardware Email Ingestion Configuration
# Generated automatically by configure_email.py

# IMAP Settings (to poll incoming emails)
IMAP_SERVER={imap_server}
IMAP_PORT={imap_port}

# SMTP Settings (to send outgoing quotes)
SMTP_SERVER={smtp_server}
SMTP_PORT={smtp_port}

# Account Credentials
EMAIL_USER={email_user}
EMAIL_PASS={email_pass}

# Gemini Settings (for Scenario B AI features)
GEMINI_API_KEY={os.environ.get("GEMINI_API_KEY", "your_gemini_api_key")}
"""
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
            
        print("\n[System] Credentials saved successfully to '.env' file!")
        print("You can now start the Email Listener in live mode using:")
        print("  python run_email_listener.py")
    else:
        print("[FAILED] Credentials validation failed. Please check your credentials and try again.")
        print("No changes were made to '.env'.")

if __name__ == "__main__":
    main()
