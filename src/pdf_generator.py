import os
import html
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------------------------------------------------------------------------
# Unicode Font Registration
# Helvetica (built-in) does NOT support ₹ (U+20B9).
# We register a TrueType font that does. Priority order:
#   1. Arial (Windows default, full Unicode)
#   2. Noto Sans (Linux/cross-platform)
#   3. DejaVu Sans (common on all OS)
# ---------------------------------------------------------------------------
_FONT_REGULAR = 'Helvetica'       # fallback name (overwritten below)
_FONT_BOLD    = 'Helvetica-Bold'  # fallback name (overwritten below)
_FONT_ITALIC  = 'Helvetica-Oblique'

def _register_unicode_fonts():
    global _FONT_REGULAR, _FONT_BOLD, _FONT_ITALIC
    candidates = [
        # (regular_path, bold_path, italic_path, name_prefix)
        (
            r'C:\Windows\Fonts\arial.ttf',
            r'C:\Windows\Fonts\arialbd.ttf',
            r'C:\Windows\Fonts\ariali.ttf',
            'Arial'
        ),
        (
            r'C:\Windows\Fonts\calibri.ttf',
            r'C:\Windows\Fonts\calibrib.ttf',
            r'C:\Windows\Fonts\calibrii.ttf',
            'Calibri'
        ),
        (
            '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
            '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
            '/usr/share/fonts/truetype/noto/NotoSans-Italic.ttf',
            'NotoSans'
        ),
        (
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf',
            'DejaVuSans'
        ),
    ]
    for reg_path, bold_path, italic_path, prefix in candidates:
        if os.path.exists(reg_path):
            try:
                pdfmetrics.registerFont(TTFont(f'{prefix}', reg_path))
                if os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont(f'{prefix}-Bold', bold_path))
                else:
                    pdfmetrics.registerFont(TTFont(f'{prefix}-Bold', reg_path))  # use regular as bold fallback
                if os.path.exists(italic_path):
                    pdfmetrics.registerFont(TTFont(f'{prefix}-Italic', italic_path))
                else:
                    pdfmetrics.registerFont(TTFont(f'{prefix}-Italic', reg_path))
                _FONT_REGULAR = prefix
                _FONT_BOLD    = f'{prefix}-Bold'
                _FONT_ITALIC  = f'{prefix}-Italic'
                print(f'[PDF] Unicode font registered: {prefix} (INR Rupee symbol supported)')
                return
            except Exception as e:
                print(f'[PDF] Font registration failed for {prefix}: {e}')
    print('[PDF] Warning: No Unicode TTF font found. INR symbol may not render correctly in PDF.')

_register_unicode_fonts()

def generate_qr_img(amount, invoice_id, temp_path, upi_id=None, upi_name=None):
    # UPI deep link dynamically configured via environment variables or parameters
    upi_id = upi_id or os.environ.get("UPI_ID", "merchant@bank")
    upi_name = upi_name or os.environ.get("UPI_MERCHANT_NAME", "TrofHardware")
    upi_name_esc = upi_name.replace(" ", "%20")
    link = f"upi://pay?pa={upi_id}&pn={upi_name_esc}&am={amount:.2f}&cu=INR&tn={invoice_id}"
    qr = qrcode.QRCode(box_size=6, border=1)
    qr.add_data(link)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(temp_path)

def find_company_logo(project_root):
    # Check .env first
    logo_env = os.environ.get("COMPANY_LOGO_PATH")
    if logo_env:
        path = os.path.join(project_root, logo_env)
        if os.path.exists(path):
            return path
            
    # Search common directories for logo.png, logo.jpg, logo.jpeg
    search_dirs = ["static", "data", "static/images", "assets", ""]
    filenames = ["logo.png", "logo.jpg", "logo.jpeg", "company_logo.png", "company_logo.jpg"]
    
    for d in search_dirs:
        for f in filenames:
            path = os.path.join(project_root, d, f) if d else os.path.join(project_root, f)
            if os.path.exists(path):
                return path
                
    # Search for any file containing 'logo' and having image extension in static, data or root
    for d in ["static", "data", ""]:
        dir_path = os.path.join(project_root, d) if d else project_root
        if os.path.exists(dir_path):
            try:
                for file in os.listdir(dir_path):
                    if "logo" in file.lower() and file.lower().endswith((".png", ".jpg", ".jpeg")):
                        return os.path.join(dir_path, file)
            except Exception:
                pass
                
    return None

def generate_pdf_quotation(matched_lines, discount_pct, customer_name, invoice_id, output_path, catalog=None, customer_phone="—", upi_id=None, upi_name=None, logo_path=None, business_name=None, customer_email=None):
    # 1. Create Directories if they don't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 2. Group items by Category
    grouped_items = {}
    raw_subtotal = 0.0
    has_mto = False
    categories_present = set()

    for line in matched_lines:
        sku_id = line['matched_sku_id']
        if sku_id == "UNKNOWN":
            continue
        qty = line['quantity']
        if qty <= 0:
            continue
        price = line['unit_price']
        line_total = price * qty
        raw_subtotal += line_total

        
        # Determine category & MTO status
        cat = "General"
        is_mto = False
        if catalog and sku_id != "UNKNOWN":
            sku_item = next((s for s in catalog.skus if s['sku_id'] == sku_id), None)
            if sku_item:
                cat = sku_item.get('category', 'General')
                if sku_item.get('stock', 100) == 0:
                    is_mto = True  # Treat out-of-stock items as MTO in production
                if sku_item.get('is_mto') == 'True':
                    is_mto = True
        
        if is_mto:
            has_mto = True
            
        categories_present.add(cat)
        
        if cat not in grouped_items:
            grouped_items[cat] = []
            
        grouped_items[cat].append({
            "name": line['matched_sku_name'],
            "id": sku_id,
            "qty": qty,
            "price": price,
            "total": line_total
        })

    # Math
    discount_amt = raw_subtotal * discount_pct
    net_subtotal = raw_subtotal - discount_amt
    tax_amt = net_subtotal * 0.18
    grand_total = net_subtotal + tax_amt

    # 3. Build ReportLab Doc
    pdf_title = f"Quotation {invoice_id} for {customer_name}" if customer_name else f"Quotation {invoice_id}"
    doc = SimpleDocTemplate(
        output_path, 
        pagesize=letter, 
        leftMargin=40, 
        rightMargin=40, 
        topMargin=40, 
        bottomMargin=40,
        title=pdf_title,
        author="Trofeo Solution"
    )
    styles = getSampleStyleSheet()
    
    # Custom styles — use registered Unicode TTF font so ₹ renders correctly
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName=_FONT_BOLD,
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName=_FONT_ITALIC,
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )

    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName=_FONT_BOLD,
        fontSize=12,
        textColor=colors.HexColor('#8E2D98'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName=_FONT_REGULAR,
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )

    prices_right_style = ParagraphStyle(
        'PricesRight',
        parent=body_style,
        fontName=_FONT_REGULAR,
        alignment=2  # 0=Left, 1=Center, 2=Right
    )

    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName=_FONT_BOLD,
        fontSize=9,
        textColor=colors.white
    )

    story = []

    # Top Header Table (Logo + Title)
    project_root = os.path.dirname(os.path.dirname(output_path))
    
    # Resolve tenant logo path
    if logo_path:
        if not os.path.isabs(logo_path):
            resolved_logo_path = os.path.join(project_root, logo_path)
        else:
            resolved_logo_path = logo_path
        if os.path.exists(resolved_logo_path):
            logo_img_path = resolved_logo_path
        else:
            logo_img_path = find_company_logo(project_root)
    else:
        logo_img_path = find_company_logo(project_root)
    
    title_flow = []
    bus_name = business_name or os.environ.get("BUSINESS_NAME", "TROFEO SOLUTION")
    title_flow.append(Paragraph(bus_name.upper(), title_style))
    title_flow.append(Paragraph(f"Price Quotation  |  Ref: {invoice_id}  |  Prepared for: {html.escape(customer_name)}", subtitle_style))
    
    if logo_img_path:
        logo_img = Image(logo_img_path, width=120, height=45)
        header_table = Table([[title_flow, logo_img]], colWidths=[380, 140])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(header_table)
    else:
        story.extend(title_flow)
    
    # Render Grouped Tables
    for category, items in grouped_items.items():
        story.append(Paragraph(html.escape(category).upper(), section_style))
        
        # Table Headers
        table_data = [[
            Paragraph("Item Description (ID)", header_style),
            Paragraph("Qty", header_style),
            Paragraph("Unit Price", header_style),
            Paragraph("Total", header_style)
        ]]
        
        for item in items:
            table_data.append([
                Paragraph(f"{html.escape(item['name'])} ({html.escape(item['id'])})", body_style),
                Paragraph(str(item['qty']), body_style),
                Paragraph(f"₹{item['price']:.2f}", body_style),
                Paragraph(f"₹{item['total']:.2f}", body_style)
            ])
            
        # Draw Table
        t = Table(table_data, colWidths=[310, 50, 80, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#8E2D98')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('BOTTOMPADDING', (0,1), (-1,-1), 4),
            ('TOPPADDING', (0,1), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(t)
        story.append(Spacer(1, 10))

    story.append(Spacer(1, 10))

    # 4. Prices & QR Code Layout Table (₹ Indian Standard)

    # Build T&C clauses dynamically
    tc_clauses = ["Prices are valid for 15 days from the date of this quotation."]
    if has_mto:
        tc_clauses.append("Some items are on order / currently out of stock. A 50% advance will be required to confirm these items.")
    if "Electrical" in categories_present:
        tc_clauses.append("Electrical items carry a 7-day replacement warranty. Please inspect on delivery.")
    if "Plumbing" in categories_present:
        tc_clauses.append("Pipes over 10ft may attract additional delivery charges. We will confirm before dispatch.")
    
    # Generate and draw QR (larger size: width=110, height=110)
    temp_qr_path = output_path.replace(".pdf", "_qr.png")
    generate_qr_img(grand_total, invoice_id, temp_qr_path, upi_id=upi_id, upi_name=upi_name)
    qr_img = Image(temp_qr_path, width=110, height=110)

    # 4. Prices table layout (placed on the right side of the page)
    prices_table_data = [
        [Paragraph("Subtotal:", body_style), Paragraph(f"₹{raw_subtotal:.2f}", prices_right_style)]
    ]
    if discount_pct > 0:
        prices_table_data.append([Paragraph(f"Special Discount ({int(discount_pct*100)}%):", body_style), Paragraph(f"-₹{discount_amt:.2f}", prices_right_style)])
        prices_table_data.append([Paragraph("Net Amount:", body_style), Paragraph(f"₹{net_subtotal:.2f}", prices_right_style)])
    prices_table_data.append([Paragraph("GST (18%):", body_style), Paragraph(f"₹{tax_amt:.2f}", prices_right_style)])
    prices_table_data.append([Paragraph("<b>Total Payable:</b>", body_style), Paragraph(f"<b>₹{grand_total:.2f}</b>", prices_right_style)])

    prices_table = Table(prices_table_data, colWidths=[130, 90])
    prices_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F8FAFC')),
    ]))

    # Align prices table to the right using a wrapper table
    prices_layout = Table([["", prices_table]], colWidths=[300, 220])
    prices_layout.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(prices_layout)

    # 5. Add Spacer for 3-4 lines (approx 25pt)
    story.append(Spacer(1, 25))

    # 6. Bottom Table containing T&C and QR side-by-side
    tc_flow = []
    tc_flow.append(Paragraph("<b>Note:</b>", body_style))
    tc_flow.append(Spacer(1, 4))
    for clause in tc_clauses:
        tc_style = ParagraphStyle('TC', parent=styles['Normal'], fontName=_FONT_REGULAR, fontSize=7.5, textColor=colors.HexColor('#475569'))
        tc_flow.append(Paragraph(f"\u2022  {html.escape(clause)}", tc_style))

    # Add company logo in footer (below note)
    footer_logo_flow = []
    if logo_img_path:
        try:
            footer_logo = Image(logo_img_path, width=100, height=38)
            footer_logo_flow.append(Spacer(1, 10))
            footer_logo_flow.append(footer_logo)
        except Exception:
            pass
    tc_flow.extend(footer_logo_flow)

    qr_flow = []
    qr_flow.append(Paragraph("<b>Scan to Pay (UPI):</b>", body_style))
    qr_flow.append(Spacer(1, 4))
    qr_flow.append(qr_img)

    bottom_table = Table([[tc_flow, qr_flow]], colWidths=[340, 180])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bottom_table)

    # Build PDF
    doc.build(story)
    
    # Save/update meta file
    meta_path = output_path.replace(".pdf", "_meta.json")
    chat_history = []
    if os.path.exists(meta_path):
        try:
            import json
            with open(meta_path, 'r', encoding='utf-8') as f:
                old_meta = json.load(f)
                chat_history = old_meta.get("chat_history", [])
        except Exception:
            pass
            
    meta_data = {
        "matched_lines": matched_lines,
        "discount_pct": discount_pct,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "customer_email": customer_email,
        "invoice_id": invoice_id,
        "chat_history": chat_history
    }
    try:
        import json
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(meta_data, f, indent=2)
    except Exception as e:
        print(f"[Warning] Failed to write quotation meta file: {e}")

    # Cleanup QR image temp file
    if os.path.exists(temp_qr_path):
        try:
            os.remove(temp_qr_path)
        except Exception:
            pass

    return output_path
