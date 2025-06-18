# Stream-Voice-AI Frontend

**Description**
A React application that captures microphone input, streams audio to the backend for transcription and LLM processing, and displays both the user's spoken text and the AI-generated response in real time.

## Prerequisites
- Node.js (>=16.x)
- npm or Yarn

## Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   ```
2. Navigate to the frontend directory:
   ```bash
   cd streaming-voice/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Environment Variables
Create a `.env.local` file in the `frontend` directory with:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Development
Start the development server:
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production
```bash
npm run build
# or
yarn build
```

## Project Structure
```
frontend/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/         # Next.js pages
│   ├── styles/        # CSS/SCSS files
│   └── utils/         # Helper functions and hooks
├── .env.local         # Environment variables
└── package.json       # Scripts & dependencies
```

## Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server

## Deployment
Deployed to Vercel.

---
