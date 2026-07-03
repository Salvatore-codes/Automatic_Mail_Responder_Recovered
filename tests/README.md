# Tests

Regression suite locking in the customer-facing behaviour we care about.

```bash
.venv/bin/python -m pytest        # run everything (uses pytest.ini)
```

## Coverage
- `test_email_body.py` — the quotation reply email: PDF-only covering note (no
  inline price table), no red out-of-stock block, AI/Human origin flag,
  grand-total math, return shape.
- `test_reply_resolution.py` — customer-reply plumbing: `CUSTOMER_REPLIED:<QTN>`
  id resolves to the quote thread (View Thread), and the analytics JOIN resolves
  the real customer name/email for a reply row.

Add a test here whenever you fix a customer-facing bug so it can't silently
regress. Run this before every deploy/merge.
