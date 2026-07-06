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
    Auto-approves <= 2%. Escalates to Pending review if > 2%.
    """
    if requested_discount <= 2.0:
        return {
            "status": "APPROVED",
            "approved_discount": requested_discount,
            "reply": f"Of course! I've applied a {requested_discount}% discount on your quotation. Please find the updated pricing attached. Let me know if there's anything else I can help with."
        }

    return {
        "status": "PENDING_REVIEW",
        "approved_discount": 0.0,
        "reply": "Thank you for your response. Your request for an additional discount is under consideration by our officials. We will get back to you shortly with the update."
    }
