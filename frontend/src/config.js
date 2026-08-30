// Central place for the backend API base URL.
// Locally, Vite reads this from frontend/.env (VITE_API_URL).
// In production (Vercel), set VITE_API_URL in the project's Environment Variables
// to your live backend URL (e.g. https://regalchoice-api.onrender.com).
// If it's not set anywhere, it falls back to localhost so local dev still works.

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";