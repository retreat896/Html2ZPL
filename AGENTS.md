# Agent Guidelines

## Repository Layout

- `frontend/` contains the React/Vite web application, styled with Mantine and Tailwind.
- `backend/` contains the local Node.js/Express API and its SQLite database.
- `worker/` contains the cloud API, implemented as a Hono Cloudflare Worker using D1.
- The root `npm run dev` script starts the frontend and local Node backend together.
- `.github/workflows/preview-png.yml` builds the frontend and uploads a dashboard preview PNG on push.

The local backend and cloud worker are two implementations of the same application API, not separate feature sets. Their storage and runtime APIs differ, but their behavior as seen by the frontend should match.

## Backend Parity

When adding or changing backend routes, validation, authentication, project/settings behavior, persistence semantics, or response formats, update both `backend/` and `worker/` in the same change. Keep request and response behavior consistent across both implementations. If a difference is intentionally platform-specific, document why and ensure it does not create inconsistent frontend behavior.

The current corresponding API routes are:

- `POST /register`, `POST /login`
- `GET /projects`, `POST /projects`, `GET /projects/:id`
- `GET /public/templates`, `GET /public/projects/:id`
- `POST /projects/:id/publish`, `DELETE /projects/:id`
- `GET /settings`, `PUT /settings`

The `/public/` routes are public; the other project and settings routes require authentication. Keep this route list current when routes are added, removed, or changed.

## Keep This Guide Current

Whenever repository layout, backend responsibilities, the shared API surface, or the parity rules change, update this `AGENTS.md` in the same change. Verify relevant behavior against both backends rather than assuming that a change in one implementation automatically affects the other.
