import sqlite3
import os

db_path = r'c:\Users\isaac\OneDrive\Desktop\kauBru ai\kaubru-backend\kaubru.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Adding social_id column...")
        cursor.execute("ALTER TABLE users ADD COLUMN social_id VARCHAR(100)")
    except sqlite3.OperationalError as e:
        print(f"social_id column error: {e}")
        
    try:
        print("Adding social_provider column...")
        cursor.execute("ALTER TABLE users ADD COLUMN social_provider VARCHAR(20)")
    except sqlite3.OperationalError as e:
        print(f"social_provider column error: {e}")
        
    conn.commit()
    conn.close()
    print("Migration complete!")
else:
    print("Database file not found.")
