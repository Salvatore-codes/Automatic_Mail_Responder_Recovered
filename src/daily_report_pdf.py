import os
import sqlite3
import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# DB Path setup
project_root = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(project_root, "data", "trofeo_sales.db")

# Font Registration for ₹ symbol support
_FONT_REGULAR = 'Helvetica'
_FONT_BOLD    = 'Helvetica-Bold'

def _register_fonts():
    global _FONT_REGULAR, _FONT_BOLD
    candidates = [
        (
            r'C:\Windows\Fonts\arial.ttf',
            r'C:\Windows\Fonts\arialbd.ttf',
            'Arial'
        ),
        (
            r'C:\Windows\Fonts\calibri.ttf',
            r'C:\Windows\Fonts\calibrib.ttf',
            'Calibri'
        ),
    ]
    for reg_path, bold_path, prefix in candidates:
        if os.path.exists(reg_path):
            try:
                pdfmetrics.registerFont(TTFont(prefix, reg_path))
                if os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont(f'{prefix}-Bold', bold_path))
                else:
                    pdfmetrics.registerFont(TTFont(f'{prefix}-Bold', reg_path))
                _FONT_REGULAR = prefix
                _FONT_BOLD    = f'{prefix}-Bold'
                return
            except Exception:
                pass

_register_fonts()

def generate_daily_report(output_path, tenant_id=None):
    """Queries SQLite and generates a daily transaction report PDF."""
    tz_ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    today_str = datetime.datetime.now(tz_ist).strftime("%Y-%m-%d")
    
    from src.database_sqlite import get_connection
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    # 1. Fetch today's quotations
    cursor.execute("SELECT * FROM quotations WHERE created_at LIKE ? ORDER BY created_at DESC", (f"{today_str}%",))
    quotes = [dict(row) for row in cursor.fetchall()]
    
    # 2. Fetch today's unmatched items
    cursor.execute("SELECT * FROM unmatched_items WHERE created_at LIKE ? ORDER BY created_at DESC", (f"{today_str}%",))
    unmatched = [dict(row) for row in cursor.fetchall()]
    
    # Fetch all items associated with today's quotes
    quote_items = {}
    if quotes:
        inv_ids = [q["invoice_id"] for q in quotes]
        placeholders = ",".join("?" for _ in inv_ids)
        cursor.execute(f"SELECT * FROM quotation_items WHERE invoice_id IN ({placeholders})", inv_ids)
        items = [dict(row) for row in cursor.fetchall()]
        for item in items:
            inv_id = item["invoice_id"]
            if inv_id not in quote_items:
                quote_items[inv_id] = []
            quote_items[inv_id].append(item)
            
    conn.close()
    
    # PDF setup
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName=_FONT_BOLD,
        fontSize=20,
        textColor=colors.HexColor("#1A365D"),
        spaceAfter=15
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName=_FONT_BOLD,
        fontSize=13,
        textColor=colors.HexColor("#2B6CB0"),
        spaceBefore=15,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName=_FONT_REGULAR,
        fontSize=9,
        leading=12
    )
    body_bold_style = ParagraphStyle(
        'ReportBodyBold',
        parent=body_style,
        fontName=_FONT_BOLD
    )
    
    story = []
    
    # Title & Metadata
    story.append(Paragraph(f"Trofeo Solution - Daily Email Ingestion & Response Report", title_style))
    story.append(Paragraph(f"<b>Date:</b> {today_str} | <b>Monitored Inbox:</b> rajarajanodooimplementers@gmail.com", body_style))
    story.append(Spacer(1, 15))
    
    # 3. Calculate Summary Metrics
    total_quotes = len(quotes)
    total_subtotal = sum(q["subtotal"] for q in quotes)
    total_discount = sum(q["subtotal"] * q["discount_pct"] for q in quotes)
    total_tax = sum(q["tax_amt"] for q in quotes)
    total_grand = sum(q["grand_total"] for q in quotes)
    unresolved_count = len(unmatched)
    
    stats_data = [
        [
            Paragraph("<b>Total Requests</b>", body_style),
            Paragraph("<b>Quotes Generated</b>", body_style),
            Paragraph("<b>Net Subtotal</b>", body_style),
            Paragraph("<b>Discounts Granted</b>", body_style),
            Paragraph("<b>GST Tax Collected</b>", body_style),
            Paragraph("<b>Grand Total (₹)</b>", body_style)
        ],
        [
            Paragraph(str(total_quotes + unresolved_count), body_bold_style),
            Paragraph(str(total_quotes), body_bold_style),
            Paragraph(f"₹{total_subtotal:.2f}", body_bold_style),
            Paragraph(f"₹{total_discount:.2f}", body_bold_style),
            Paragraph(f"₹{total_tax:.2f}", body_bold_style),
            Paragraph(f"₹{total_grand:.2f}", body_bold_style)
        ]
    ]
    
    stats_table = Table(stats_data, colWidths=[90, 90, 90, 90, 90, 90])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EDF2F7")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    story.append(Paragraph("Performance Metrics Summary", section_style))
    story.append(stats_table)
    story.append(Spacer(1, 15))
    
    # 4. Today's Transaction Log Table
    story.append(Paragraph("Processed Orders & Negotiation Logs", section_style))
    if not quotes:
        story.append(Paragraph("<i>No automated quotations generated today.</i>", body_style))
    else:
        log_headers = [
            Paragraph("<b>Invoice</b>", body_bold_style),
            Paragraph("<b>Customer Details</b>", body_bold_style),
            Paragraph("<b>Subtotal (₹)</b>", body_bold_style),
            Paragraph("<b>Discount (₹)</b>", body_bold_style),
            Paragraph("<b>Total (₹)</b>", body_bold_style),
            Paragraph("<b>Status</b>", body_bold_style)
        ]
        
        log_rows = [log_headers]
        for q in quotes:
            disc_val = q["subtotal"] * q["discount_pct"]
            items_list = quote_items.get(q["invoice_id"], [])
            items_text = ", ".join(f"{item['sku_name']} (x{item['quantity']})" for item in items_list)
            
            cust_text = f"<b>{q['customer_name']}</b><br/>{q['customer_email']}<br/><font color='#718096'>{items_text}</font>"
            
            log_rows.append([
                Paragraph(f"#{q['invoice_id']}", body_bold_style),
                Paragraph(cust_text, body_style),
                Paragraph(f"₹{q['subtotal']:.2f}", body_style),
                Paragraph(f"₹{disc_val:.2f}", body_style),
                Paragraph(f"₹{q['grand_total']:.2f}", body_bold_style),
                Paragraph(f"<font color='#2B6CB0'><b>{q['status']}</b></font>", body_style)
            ])
            
        log_table = Table(log_rows, colWidths=[55, 235, 65, 65, 65, 55])
        log_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B6CB0")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        # Apply white color to headers in ReportLab Paragraph
        for i in range(len(log_headers)):
            log_headers[i].style.textColor = colors.white
            
        story.append(log_table)
        
    story.append(Spacer(1, 15))
    
    # 5. Today's Unmatched / Uncategorized Enquiries
    story.append(Paragraph("Unresolved Customer Requests (Requires Manual Follow-up)", section_style))
    if not unmatched:
        story.append(Paragraph("<i>No unresolved or uncategorized requests today. All enquiries processed successfully.</i>", body_style))
    else:
        unmatched_headers = [
            Paragraph("<b>Customer Name</b>", body_bold_style),
            Paragraph("<b>Customer Email</b>", body_bold_style),
            Paragraph("<b>Enquiry Excerpt</b>", body_bold_style),
            Paragraph("<b>Source</b>", body_bold_style),
            Paragraph("<b>Date/Time</b>", body_bold_style)
        ]
        
        unmatched_rows = [unmatched_headers]
        for u in unmatched:
            body_excerpt = (u.get('original_body') or '')[:300].replace('\n', ' ').strip()
            if len(u.get('original_body') or '') > 300:
                body_excerpt += "..."
            unmatched_rows.append([
                Paragraph(u.get('customer_name', 'Unknown'), body_bold_style),
                Paragraph(u.get('customer_email', '—'), body_style),
                Paragraph(body_excerpt, body_style),
                Paragraph(u.get('source', '—'), body_style),
                Paragraph(u.get('created_at', '—'), body_style)
            ])
            
        unmatched_table = Table(unmatched_rows, colWidths=[90, 130, 215, 55, 90])
        unmatched_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#C53030")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        for i in range(len(unmatched_headers)):
            unmatched_headers[i].style.textColor = colors.white
            
        story.append(unmatched_table)
        
    # Build Document
    doc.build(story)
    print(f"[Success] Daily report PDF generated at {output_path}")

def send_daily_report_email(smtp_server, smtp_port, email_user, email_pass, recipient_email, tenant_id=None):
    """Generates the daily report PDF and emails it to the supervisor."""
    tz_ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    today_str = datetime.datetime.now(tz_ist).strftime("%Y-%m-%d")
    pdf_filename = f"Daily_Report_{today_str}.pdf"
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if tenant_id and tenant_id != "default":
        pdf_dir = os.path.join(project_root, "static", tenant_id)
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_path = os.path.join(pdf_dir, pdf_filename)
    else:
        pdf_path = os.path.join(project_root, "static", pdf_filename)
    
    # 1. Generate PDF
    generate_daily_report(pdf_path, tenant_id=tenant_id)
    
    if not email_user or not email_pass or not recipient_email:
        print("[Warning] SMTP settings missing. Daily report not emailed.")
        return False
        
    try:
        # 2. Setup email
        msg = MIMEMultipart()
        msg["From"] = email_user
        msg["To"] = recipient_email
        msg["Subject"] = f"Trofeo Daily Sales & Email Responder Report - {today_str}"
        
        body_text = (
            f"Dear Team,\n\n"
            f"Please find attached the daily summary report of the Trofeo Hardware Automatic Mail Responder.\n\n"
            f"Report Details:\n"
            f"- Date: {today_str}\n"
            f"- Monitored Inbox: {email_user}\n\n"
            f"This PDF includes matching metrics, transaction logs, applied discounts, and a list of uncategorized client requests requiring manual quotations.\n\n"
            f"Regards,\n"
            f"Trofeo Solution Automation Desk"
        )
        msg.attach(MIMEText(body_text, 'plain'))
        
        # 3. Attach PDF
        with open(pdf_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f"attachment; filename={pdf_filename}")
        msg.attach(part)
        
        # 4. Connect and send
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            
        server.login(email_user, email_pass)
        server.sendmail(email_user, recipient_email, msg.as_string())
        server.close()
        print(f"[Master Report] Daily report PDF successfully emailed to {recipient_email}")
        return True
    except Exception as e:
        print(f"[Error] Failed to email daily report PDF: {e}")
        return False
