# 🌿 KauBru AI Translator

> **Preserve. Translate. Learn.**
> A full-stack mobile app to digitize and preserve the KauBru/Reang language.

---

## Project Structure

```
kauBru ai/
├── kaubru-backend/          # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py        # App settings & env vars
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── auth.py          # JWT auth & password hashing
│   │   ├── translation_service.py  # Rule-based translation engine
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── translation.py
│   │       ├── dictionary.py
│   │       ├── contributions.py
│   │       ├── lessons.py
│   │       └── premium.py
│   ├── seed.py              # Seed script (words, lessons, demo user)
│   ├── requirements.txt
│   └── .env
│
└── kaubru-app/              # React Native + Expo frontend
    ├── src/
    │   ├── config/
    │   │   ├── api.ts        # API base URL config
    │   │   └── theme.ts      # Colors, spacing, radius
    │   ├── services/
    │   │   └── api.ts        # Axios API client
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── components/
    │   │   ├── GradientBackground.tsx
    │   │   ├── GlassCard.tsx
    │   │   ├── PrimaryButton.tsx
    │   │   ├── InputField.tsx
    │   │   └── LoadingOverlay.tsx
    │   ├── screens/
    │   │   ├── OnboardingScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── SignupScreen.tsx
    │   │   ├── HomeScreen.tsx
    │   │   ├── DictionaryScreen.tsx
    │   │   ├── LearnScreen.tsx
    │   │   ├── ContributeScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   └── PremiumScreen.tsx
    │   └── navigation/
    │       └── AppNavigator.tsx
    ├── App.tsx
    ├── app.json
    ├── package.json
    └── tsconfig.json
```

---

## Backend Setup

### Requirements
- Python 3.10+
- pip

### Steps

```bash
# 1. Enter backend folder
cd kaubru-backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Seed the database (creates kaubru.db with 37 words, 6 lessons, demo user)
python seed.py

# 6. Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at: **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

### Demo Account
- Email: `demo@kaubru.app`
- Password: `demo1234`

---

## Frontend Setup

### Requirements
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (or Android/iOS emulator)

### Steps

```bash
# 1. Enter frontend folder
cd kaubru-app

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure API URL
# Edit src/config/api.ts and set API_BASE_URL:
#   Android emulator:  http://10.0.2.2:8000
#   iOS simulator:     http://localhost:8000
#   Physical device:   http://YOUR_LOCAL_IP:8000
#   (find your IP with: ipconfig on Windows, ifconfig on Mac/Linux)

# 4. Start Expo
npx expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan the QR code with Expo Go on your phone

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/login` | No | Login, get JWT |
| GET | `/auth/me` | Yes | Current user |
| POST | `/translate` | Yes | Translate text |
| GET | `/translations/history` | Yes | Translation history |
| GET | `/dictionary` | Yes | All words |
| GET | `/dictionary/search?q=` | Yes | Search words |
| GET | `/dictionary/categories` | Yes | Word categories |
| POST | `/dictionary/save/{id}` | Yes | Save a word |
| GET | `/dictionary/saved` | Yes | Saved words |
| POST | `/contributions` | Yes | Submit contribution |
| GET | `/contributions/my` | Yes | My contributions |
| GET | `/lessons` | Yes | All lessons |
| GET | `/premium/plans` | Yes | Premium plans |

---

## Testing the API

### Using curl

```bash
# Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test1234"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@kaubru.app","password":"demo1234"}'

# Translate (replace TOKEN with your JWT)
curl -X POST http://localhost:8000/translate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","direction":"en_to_kb"}'

# Dictionary search
curl "http://localhost:8000/dictionary/search?q=water" \
  -H "Authorization: Bearer TOKEN"
```

### Using Swagger UI
Open **http://localhost:8000/docs** in your browser for interactive API testing.

---

## Translation Logic

The translation engine (`app/translation_service.py`) works in two steps:

1. **Exact phrase match** — checks if the full normalized input exists in the dictionary
2. **Word-by-word fallback** — translates each token individually; unknown words are kept as-is and reported

Supports both directions: `en_to_kb` (English → KauBru) and `kb_to_en` (KauBru → English).

---

## Deployment Notes

### Backend (Production)
- Replace `SECRET_KEY` in `.env` with a strong random key
- Switch `DATABASE_URL` to PostgreSQL: `postgresql://user:pass@host/dbname`
- Install `psycopg2-binary` for PostgreSQL support
- Use `gunicorn` with uvicorn workers: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`
- Deploy to: Railway, Render, Fly.io, or AWS EC2
- Set `allow_origins` in CORS to your frontend domain

### Frontend (Production)
- Update `API_BASE_URL` in `src/config/api.ts` to your production backend URL
- Build for production: `npx expo build:android` or `npx expo build:ios`
- Or use EAS Build: `npx eas build`
- Publish to Google Play / App Store

### Database Migration
- For schema changes, use Alembic: `pip install alembic`
- Initialize: `alembic init alembic`
- Create migration: `alembic revision --autogenerate -m "description"`
- Apply: `alembic upgrade head`

---

## Seed Data Summary

**37 words** across categories: greetings, family, nature, food, places, numbers, adjectives, phrases

**6 lessons**: Common Greetings, Family Words, Numbers 1–10, Daily Conversations, Folk Stories (Premium), Pronunciation Practice (Premium)

**1 demo user**: demo@kaubru.app / demo1234

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native + Expo + TypeScript |
| Navigation | React Navigation v6 |
| HTTP Client | Axios |
| Token Storage | AsyncStorage |
| Backend | Python FastAPI |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | Pydantic v2 |
