import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "kaubru.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables in DB:", [t[0] for t in tables])

try:
    cursor.execute("SELECT * FROM picture_words LIMIT 1")
    print("Table picture_words is healthy!")
except Exception as e:
    print("Error querying picture_words:", e)

conn.close()
