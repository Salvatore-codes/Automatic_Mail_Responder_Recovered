import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class NegotiationOutcome(BaseModel):
    approved_discount: float = Field(description="The discount percentage (0 to 100) approved or countered for this turn.")
    status: str = Field(description="The status of negotiation: 'APPROVED' (fully accepted customer request) or 'NEGOTIATING' (counter-offered, awaiting customer response)")
    reply: str = Field(description="The warm, natural conversational reply email to send to the customer.")

def run_negotiation_step(customer_message, requested_discount, chat_history, items=None, catalog=None, is_live=False, client=None):
    """
    Handles conversational negotiation for discounts with profit margin protection.
    Protects a profit margin floor of 15% on selling price.
    
    If requested_discount is <= 2.0%, auto-approves it.
    If requested_discount is > 2.0%, dynamically computes max allowed discount based on cost prices:
      - Default cost is 70% of standard price (30% margin).
      - If cost_price or buying_price columns exist in catalog, they are used.
      - Capped at 20% max discount.
    """
    if requested_discount is None or requested_discount <= 0.0:
        requested_discount = 5.0 # default fallback requested discount
        
    # 1. Compute standard price and cost price of items in the quotation
    total_standard_price = 0.0
    total_cost_price = 0.0
    
    items = items or []
    for item in items:
        sku_id = item.get("matched_sku_id")
        if not sku_id or sku_id == "UNKNOWN":
            continue
        
        qty = item.get("quantity", 1)
        unit_price = item.get("unit_price", 0.0)
        
        price = unit_price
        cost_price = price * 0.70 # Default: 30% margin
        
        if catalog:
            sku = catalog.get_by_sku_id(sku_id)
            if sku:
                price = sku.get("price", unit_price)
                cost_price = sku.get("cost_price", sku.get("buying_price", price * 0.70))
        
        try:
            price = float(price)
            cost_price = float(cost_price)
        except (ValueError, TypeError):
            price = unit_price
            cost_price = price * 0.70
            
        total_standard_price += price * qty
        total_cost_price += cost_price * qty

    # Calculate maximum allowed discount to keep at least 15% profit margin:
    # (SellingPrice - CostPrice) / SellingPrice >= 0.15 => SellingPrice >= CostPrice / 0.85
    # StandardPrice * (1 - d) >= CostPrice / 0.85 => d <= 1 - CostPrice / (StandardPrice * 0.85)
    if total_standard_price > 0.0:
        max_discount_pct = (1.0 - (total_cost_price / (total_standard_price * 0.85))) * 100.0
        max_discount_pct = max(0.0, min(20.0, max_discount_pct))
    else:
        max_discount_pct = 2.0 # Fallback safety limit

    # Round max discount to 1 decimal place
    max_discount_pct = round(max_discount_pct, 1)

    # 2. Bargaining logic
    status = "NEGOTIATING"
    approved_discount = 0.0
    
    if requested_discount <= 2.0:
        status = "APPROVED"
        approved_discount = requested_discount
    elif requested_discount <= max_discount_pct:
        # Determine turn count from chat history to adjust bargaining aggressiveness
        cust_turns = sum(1 for msg in chat_history if msg.get("sender") == "customer")
        
        if cust_turns <= 1:
            # First turn: make a counter-offer (70% of requested discount, at least 2.5%)
            approved_discount = max(2.5, round(requested_discount * 0.7, 1))
            # Ensure counter-offer doesn't exceed requested discount
            approved_discount = min(approved_discount, requested_discount)
            status = "NEGOTIATING"
        else:
            # Subsequent turn: fully approve the customer's request
            approved_discount = requested_discount
            status = "APPROVED"
    else:
        # Requested discount is above our margin floor. Offer our maximum safe limit.
        approved_discount = max(2.0, max_discount_pct)
        status = "NEGOTIATING"
        
    # 3. Reply text generation
    reply = ""
    if is_live and client:
        # Use Gemini to generate a warm, customized email response
        history_str = "\n".join([f"{msg.get('sender').upper()}: {msg.get('text')}" for msg in chat_history])
        prompt = f"""You are an AI sales assistant negotiating a quote discount with a customer.
Conversation History:
---
{history_str}
---
Customer's requested discount: {requested_discount}%
Our counter-offer/approved discount: {approved_discount}%
We are countering or approving with exactly {approved_discount}% discount on this quote.

Write a warm, professional email response to the customer.
- If we are fully approving their request (approved discount equals requested discount), let them know and say the updated quote is attached.
- If we are offering a counter-offer (approved discount is less than requested discount), explain politely that we cannot offer the full {requested_discount}% but we've applied {approved_discount}% as our absolute best price.
- Keep it concise, friendly, and natural. Do NOT use placeholders (like [Company] or [Your Name]). Sign off as "Sales Team".
"""
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            reply = response.text.strip()
        except Exception as e:
            print(f"[Negotiator] Live generation failed: {e}")
            reply = ""

    # Fallback to templates if live generation failed or was disabled
    if not reply:
        if status == "APPROVED":
            reply = (
                f"Thank you for your response. We are pleased to approve your request for a {approved_discount}% discount. "
                f"We have updated your quotation accordingly. Please find the new quote attached. Let us know if you'd like to proceed!"
            )
        else:
            reply = (
                f"Thank you for contacting us. While we are unable to meet the requested {requested_discount}% discount, "
                f"we would be glad to offer a {approved_discount}% discount on this quote as our absolute best price. "
                f"The updated quotation with {approved_discount}% discount is attached for your review. Let us know if this works for you."
            )

    return {
        "approved_discount": approved_discount,
        "status": status,
        "reply": reply
    }
