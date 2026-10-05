# Product Management — React frontend

React 18 + Vite client for the LavaLust Product Management API
(Login → Product list → Add / Edit / Delete → Logout).

```bash
cp .env.example .env     # set VITE_API_URL
npm install
npm run dev              # http://localhost:5173
npm run build            # production build in ./dist
```

* `VITE_API_URL` — URL of the LavaLust API (no trailing slash).
* The app talks **only** to the API; it never connects to the database.
* Tokens are kept in `localStorage`; the access token is refreshed automatically with the refresh token.
* Deploy on Render as a **Static Site**: build `npm install && npm run build`, publish directory `dist`,
  env var `VITE_API_URL=https://YOUR-API.onrender.com`.
* Login: `admin@example.com` / `Admin@12345` (seeded by the API migration), or register a new account.
