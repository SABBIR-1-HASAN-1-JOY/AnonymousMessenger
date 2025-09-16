# Anonymous Messenger – System Overview

This document explains the code structure, responsibilities, and data flow for both the backend and frontend, including how the 5‑minute disappearing messages work.

## Project layout

- client/ — React + Vite + TypeScript + Tailwind frontend
- server/ — Node.js + Express + PostgreSQL backend
- server/migrations/ — SQL DDL, triggers, and cleanup helpers
- server/controllers, queries, routes — Modular structure for domain logic (current app paths are centralized in `server/index.js`)

## Backend (Node.js + Express + PostgreSQL)

Tech:
- Express for HTTP API, CORS enabled
- PostgreSQL via `pg` pool (Neon friendly SSL)
- Nodemon for local dev

Main entry: `server/index.js`

### Auth endpoints
- POST `/api/verify-code` — verify a one‑time code for login
- POST `/api/check-username` — ensure username uniqueness
- POST `/api/create-user` — create an anonymous user
- POST `/api/logout` — logout and cleanup user data (preserving groups for 5h)

### P2P messaging
- POST `/api/join-p2p` — join queue and randomly match (ORDER BY RANDOM())
- GET `/api/check-p2p/:username` — waiting/matched status and partner
- POST `/api/send-p2p-message` — insert message with DB‑side `expires_at` (5m)
- GET `/api/get-p2p-messages/:username/:partner` — fetch non‑expired messages only
  - Returns: `messages` with `sender`, `message`, `sent_at`, `expires_at`
  - Also returns `server_now` so the client can sync countdowns to server time
- POST `/api/leave-p2p` — leave queue/connection
- GET `/api/queue-stats` — small queue metrics for UI

### Group messaging
- POST `/api/create-group` — create topic + optional description; initializes counts
- GET `/api/groups` — list/search groups; includes member/message counts; excludes expired groups
- POST `/api/join-group` and `/api/leave-group` — manage membership
- GET `/api/user-groups/:username` — groups a user belongs to (non‑expired)
- POST `/api/send-group-message` — insert with 5m `expires_at`; trims oldest if exceeding cap
- GET `/api/get-group-messages/:groupId?username=...` — fetch non‑expired messages only
  - Returns: `messages` with `sender`, `message`, `sent_at`, `expires_at` and `server_now`

### Cleanup jobs (background intervals)
- Expired P2P connections/messages — remove rows at/after expiration
- Inactive users (10m of inactivity) — remove user and personal data, but keep groups they created for 5 hours
- Login codes — prune expired codes
- Group messages/groups — prune expired messages (5m) and groups past retention rules

### Helper cleanup
- `cleanupUserPreservingGroups(username)` — deletes user data while retaining groups they created for 5h

## Database schema (key tables)

- `users(username, last_active, ...)`
- `login_codes(username, code, expires_at)`
- `p2p_connections(id, user1, user2, status, expires_at)`
- `p2p_messages(id, connection_id, sender, message, sent_at, expires_at default now() + interval '5 minutes')`
- `groups(id, topic, description, creator, created_at, expires_at, member_count, message_count, ...)`
- `group_members(group_id, username, joined_at)`
- `group_messages(id, group_id, sender, message, sent_at, expires_at default now() + interval '5 minutes')`

Notes:
- Message TTL is enforced in DB (`expires_at`) and respected on reads
- Read queries filter `expires_at > NOW()` so expired rows are never returned

## Frontend (React + Vite + TypeScript + Tailwind)

Tech:
- React 18 with hooks and functional components
- Vite dev server and bundler
- Tailwind CSS utility classes
- Emoji Mart for emoji picker

Key files:
- `client/src/main.tsx` — app bootstrap
- `client/src/App.tsx` — routes/layout
- `client/src/context/AuthContext.tsx` — login state, code verification, create user, logout
- `client/src/components/Messaging/Messaging.tsx` — all chat UI (P2P + Group)
- `client/src/types/emoji-mart.d.ts` — minimal type shims for Emoji Mart

### Messaging component responsibilities
- Modes: `select`, `p2p`, `group-browse`, `group-create`, `group-chat`
- P2P
  - Join queue, poll for match/status
  - When connected, poll messages; send messages
- Groups
  - Browse/search/join/create groups
  - Poll group messages; send messages
- Emoji picker in inputs
- Disappearing countdown per message
  - Server returns `sent_at`, `expires_at`, and `server_now`
  - Client computes `serverNowOffset = server_now - Date.now()` and updates a local `now` tick every second
  - Remaining time = `expires_at - (now + serverNowOffset)` → always starts at 5m 00s and reaches 0m 00s exactly on the server schedule
  - Messages vanish on next poll because API doesn’t return expired rows

## 5‑minute deletion: end‑to‑end behavior

1) Insert: DB sets `expires_at = now() + 5 minutes` via default
2) Read: API returns only rows with `expires_at > NOW()` and includes `server_now`
3) UI: live countdown based on `expires_at` and server time; expired messages stop appearing
4) Cleanup: background jobs prune expired rows for storage hygiene

## Minimal run (local)

Backend:
- From `server/`: `npm install` then `npm start` (nodemon)
- Ensure PostgreSQL URL in env is set; Neon users keep SSL `rejectUnauthorized: false`

Frontend:
- From `client/`: `npm install` then `npm start` (Vite on 5173)

Open http://localhost:5173/ and follow login → username → messaging.

## Notes
- If countdown doesn’t start at 5:00, ensure endpoints return `expires_at` and `server_now`, and the client computes with `serverNowOffset`.
- Group message reads must filter `expires_at > NOW()` (already implemented) for immediate disappearance.
