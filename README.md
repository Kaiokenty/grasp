# GRASP — AI-Powered Voice-First Note & Task Organizer

Web MVP for capturing, organizing, and tracking tasks via voice and text.

## Project Structure

```
grasp/
├── backend/           # Node.js + Express API
│   ├── src/
│   ├── migrations/    # PostgreSQL migrations
│   ├── package.json
│   └── .env.example
├── frontend/          # React web app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── GRASP.md           # Project spec & 9-week plan
├── CLAUDE.md          # Coding rules for this repo
└── README.md          # This file
```

## Tech Stack

- **Frontend:** React 18+, TypeScript
- **Backend:** Node.js + Express, PostgreSQL
- **LLM:** Claude Haiku 4.5 (Anthropic)
- **Speech-to-Text:** OpenAI Whisper API
- **Hosting:** Vercel (frontend), Railway/Render (backend)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Git

### Setup

1. **Clone repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/grasp.git
   cd grasp
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your DATABASE_URL, API keys
   npm run migrate
   npm run dev
   ```

3. **Frontend setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

4. **Access app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api

## Development

- See `GRASP.md` for 9-week implementation plan and API contracts
- See `CLAUDE.md` for coding rules and conventions
- Create issues for each week's tasks; use GitHub project board

## Cost Monitoring

- Whisper API: ~$5.40/month (10 notes/day baseline)
- Claude Haiku: ~$0.026/month (with prompt caching)
- Set up cost alerts in OpenAI/Anthropic dashboards

## Next Steps

1. Week 1: Backend scaffolding + auth (see GRASP.md)
2. Set up PostgreSQL locally
3. Create backend project structure
4. Initialize frontend with Vite or Create React App

---

For detailed implementation plan, see [GRASP.md](./GRASP.md).
