"""
Seed the production database.
Usage: set DATABASE_URL env var, then run: python seed_production.py
"""
import os
import sys

# You MUST set the production DATABASE_URL before running
# Example: set DATABASE_URL=postgresql://postgres:PASSWORD@host:port/railway
if "sqlite" in os.environ.get("DATABASE_URL", "sqlite"):
    print("WARNING: You are about to seed a LOCAL SQLite database.")
    print("To seed production, set DATABASE_URL to your Railway PostgreSQL URL first:")
    print('  set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:PORT/railway')
    print()
    resp = input("Continue with local DB? (y/n): ")
    if resp.lower() != "y":
        sys.exit(0)

# Now import and run the seed
from seed import seed, seed_admin, db

seed()
seed_admin()
db.close()
print("\n✅ Production database seeded successfully!")
