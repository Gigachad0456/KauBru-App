from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    stories = db.query(models.Story).all()
    print(f"Total Stories: {len(stories)}")
    for s in stories:
        print(f"ID: {s.id} | Title: {s.title}")
        print(f"  - Illustrations: {[ill.image_url for ill in s.illustrations]}")
        print(f"  - Vocab: {[v.word.english for v in s.vocabulary]}")
finally:
    db.close()
