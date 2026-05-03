import os
import sys

# Add the backend directory to sys.path
backend_path = r'c:\Users\isaac\OneDrive\Desktop\kauBru ai\kaubru-backend'
sys.path.append(backend_path)

try:
    from app.main import app
    print("App loaded successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
