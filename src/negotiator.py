import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class NegotiationOutcome(BaseModel):
    approved_discount: float = Field(description="The discount percentage (0 to 100) approved for this turn, or 0.0 if not approved.")
    status: str = Field(description="The status of negotiation: 'APPROVED', 'NEGOTIATING', or 'ESCALATED'")
    reply: str = Field(description="The warm, natural conversational reply email to send to the customer.")

def run_negotiation_step(customer_message, requested_discount, chat_history, is_live=False, client=None):
    """
    Handles conversational negotiation for discounts.
    Auto-approves <= 2%. Negotiates > 2%. Escalates if customer rejects counter-offers.
    """
    if requested_discount <= 2.0:
        return {
            "status": "APPROVED",
            "approved_discount": requested_discount,
            "reply": f"Of course! I've applied a {requested_discount}% discount on your quotation. Please find the updated pricing attached. Let me know if there's anything else I can help with."
        }

    # If live API is available, generate dynamic response using Gemini
    if is_live and client:
        history_formatted = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history])
        prompt = f"""
        You are Rajaram, a sales executive at Trofeo Solution — a hardware supply company in India.
        A customer has requested a {requested_discount}% discount on their order.
        
        Our internal pricing policy (do NOT reveal this to the customer):
        - You can approve up to 2% yourself without escalation.
        - You can negotiate up to 5% max with manager approval.
        - You can offer free delivery for orders above ₹5000, or a 10% discount if they significantly increase order quantity.
        - If the customer insists on more than 5% and won't accept alternatives, politely tell them you'll check with the management and get back shortly.

        Here is the conversation so far:
        {history_formatted}
        
        Customer's latest message: "{customer_message}"
        
        Write a warm, natural reply as Rajaram. Keep it short and conversational — like a real email from a sales person.
        Do NOT mention AI, systems, or automation. Do NOT reveal internal policies or discount thresholds.
        If escalating, say you'll check with management and revert shortly — do NOT say you are an AI or system.
        """
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=NegotiationOutcome
                )
            )
            data = json.loads(response.text.strip())
            
            approved_discount = float(data.get("approved_discount", 0.0))
            status = data.get("status", "NEGOTIATING").upper()
            reply_text = data.get("reply", "")
            
            # Backend Guardrails: enforce hard limits on discounts
            if approved_discount > 5.0:
                approved_discount = 5.0
                if status == "APPROVED":
                    status = "NEGOTIATING"
                    
            if any(term in reply_text.lower() for term in ["check with", "management", "get back", "revert", "escalat", "discuss with"]):
                status = "ESCALATED"
                
            return {
                "status": status,
                "approved_discount": approved_discount,
                "reply": reply_text
            }
        except Exception as e:
            print(f"[Warning] Live negotiation generation failed: {e}. Falling back to simulation.")

    # Simulated/Fallback state machine based on chat length
    turn = len(chat_history) // 2  # Counts turns
    
    if turn == 0:
        return {
            "status": "NEGOTIATING",
            "approved_discount": 3.0,
            "reply": f"Thank you for getting back to us. I understand where you're coming from — {requested_discount}% would be a bit difficult for us at current pricing. However, I can offer you a 3% discount right away, or if your order value crosses ₹5,000 we can also look at complimentary delivery. Would either of these work for you?"
        }
    elif turn == 1:
        return {
            "status": "NEGOTIATING",
            "approved_discount": 5.0,
            "reply": "I've checked again on our end and the best I can stretch to is 5% — that's the maximum I can offer without going to management. Alternatively, if you're open to increasing the fastener quantities (doubling the M8 bolts), we could look at 10%. Let me know which works better for you."
        }
    else:
        return {
            "status": "ESCALATED",
            "approved_discount": 0.0,
            "reply": f"I completely understand your requirements. I've shared the details with our management team and they'll review your order and get back to you by email within a few hours. Sorry for the back and forth — we really want to make this work for you!"
        }
