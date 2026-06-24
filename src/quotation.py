def generate_quotation_table(matched_lines, discount_pct=0.0, catalog=None):
    """
    Formulates a formatted text table with pricing, CRM customer discounts,
    ERP stock checks, and tax calculations.
    """
    output = []
    output.append("=" * 125)
    output.append(f"{'ITEM / CUSTOMER ENQUIRY':<35} | {'MATCHED SKU (ID)':<40} | {'QTY':<4} | {'CONFIDENCE':<10} | {'STOCK STATUS':<15} | {'PRICE':<6} | {'TOTAL':<8}")
    output.append("=" * 125)
    
    raw_subtotal = 0.0
    
    for line in matched_lines:
        orig = line['original_line']
        if len(orig) > 33:
            orig = orig[:30] + "..."
            
        sku_display = f"{line['matched_sku_name']} ({line['matched_sku_id']})"
        if len(sku_display) > 38:
            sku_display = sku_display[:35] + "..."
            
        qty = line['quantity']
        conf = f"{line['confidence']}% ({line['match_method'][:6]})"
        price = line['unit_price']
        line_total = price * qty
        raw_subtotal += line_total
        
        # ERP Stock Check
        stock_status = "In Stock"
        if catalog and line['matched_sku_id'] != "UNKNOWN":
            sku_item = next((s for s in catalog.skus if s['sku_id'] == line['matched_sku_id']), None)
            if sku_item:
                avail = sku_item['stock']
                if avail <= 0:
                    stock_status = "OUT OF STOCK"
                elif avail < qty:
                    stock_status = f"LOW ({avail} avail)"
        elif line['matched_sku_id'] == "UNKNOWN":
            stock_status = "N/A"
            
        output.append(f"{orig:<35} | {sku_display:<40} | {qty:<4} | {conf:<10} | {stock_status:<15} | ₹{price:<5.2f} | ₹{line_total:<7.2f}")
        
    output.append("-" * 125)
    
    discount_amt = raw_subtotal * discount_pct
    discounted_subtotal = raw_subtotal - discount_amt
    tax_rate = 0.18 # 18% standard VAT/GST
    tax_amount = discounted_subtotal * tax_rate
    grand_total = discounted_subtotal + tax_amount
    
    output.append(f"{'':<90} Raw Subtotal:   ₹{raw_subtotal:>8.2f}")
    if discount_pct > 0:
        output.append(f"{'':<90} CRM Discount ({int(discount_pct*100)}%): -₹{discount_amt:>8.2f}")
        output.append(f"{'':<90} Net Subtotal:   ₹{discounted_subtotal:>8.2f}")
    output.append(f"{'':<90} GST 18%:        ₹{tax_amount:>8.2f}")
    output.append(f"{'':<90} Grand Total:    ₹{grand_total:>8.2f}")
    output.append("=" * 125)
    
    return "\n".join(output)
