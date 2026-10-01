# PennyWise - AI-Powered Personal Finance Tracker

PennyWise is a comprehensive personal finance tracking application featuring an AI financial coach, goal tracking, EMIs, budgets, and detailed insights.

## Project Architecture

This project is built using a modern decoupled **Full-Stack Architecture**:

1. **Frontend (React/Vite)**
   - Responsible for UI rendering, user interactions, and authentication state management.
   - Built with React, Tailwind CSS, shadcn-ui.
2. **Backend (FastAPI)**
   - Responsible for all business logic, data validation, database access, and secure AI API interactions.
   - Built with Python, FastAPI, SQLAlchemy, and Pydantic.
3. **Database (Supabase PostgreSQL)**
   - Provides secure relational data storage.
4. **Authentication (Supabase Auth)**
   - Provides secure session management. The frontend obtains a JWT which is securely passed to the FastAPI backend.

### Request Flow
- **Authentication**: `React -> Supabase Auth`
- **Application Data**: `React -> FastAPI (via /api endpoints with Bearer JWT) -> Supabase PostgreSQL DB`

The frontend **never** accesses the Supabase REST APIs directly for application data.

## Environment Setup

### 1. Frontend Configuration
Create a `.env` file in the root directory based on `.env.example`:
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_BASE_URL=/api
```

### 2. Backend Configuration
Create a `.env` file in the `backend/` directory:
```env
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
DATABASE_URL=postgresql://postgres:<password>@<db-pool-url>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GEMINI_API_KEY=<gemini-api-key>
GEMINI_MODEL=gemini-1.5-pro
```
*Note: Never commit your `.env` files to version control.*

## Local Development Setup

### Running the Backend (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations (if applicable):
   ```bash
   alembic upgrade head
   ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Running the Frontend (React/Vite)
1. In a new terminal, navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:8080` (or `http://localhost:5173` depending on console output). Vite will automatically proxy `/api` requests to the FastAPI backend.

## Security Model
- **Authentication Validation**: Every protected FastAPI endpoint demands a valid Supabase JWT.
- **Ownership Isolation**: FastAPI enforces that users can only read, edit, or delete their own records by decoding the UUID from the verified JWT and applying it to all database queries (`user_id == current_user.id`).
- **No Client-Side Secrets**: The `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `GEMINI_API_KEY` are kept strictly on the backend.
- **AI Safety**: The financial snapshot is gathered natively on the server before being sent to the Gemini AI API, preventing frontend manipulation of balances or data for the AI prompt.
