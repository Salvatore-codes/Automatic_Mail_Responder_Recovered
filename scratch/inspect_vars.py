import inspect
import sys
sys.path.append("D:\\sku-matcher-prototype")
from src.email_listener import extract_text_from_attachments

print("Local variables:", extract_text_from_attachments.__code__.co_varnames)
print("Free variables:", extract_text_from_attachments.__code__.co_freevars)
print("Cell variables:", extract_text_from_attachments.__code__.co_cellvars)
