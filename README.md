# Mock Test Platform - Backend

Node.js + Express + TypeScript + PostgreSQL + Prisma + JWT backend for auth,
interview CRUD, submissions, and attempt history.

## Setup (local)

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

API runs at `http://localhost:4000`.

## Endpoints

### Auth

#### POST /register
```json
{ "name": "Alice", "email": "alice@test.com", "password": "secret123", "role": "STUDENT" }
```
Returns `201 { user, token }`.

#### POST /login
```json
{ "email": "alice@test.com", "password": "secret123" }
```
Returns `200 { user, token }`.

#### GET /me
Header: `Authorization: Bearer <token>`
Returns `200 { user }`.

### Interviews

All interview endpoints require `Authorization: Bearer <token>`.
Admin-only routes require the user role to be `ADMIN`.

```text
GET    /interviews                         -> { interviews }
GET    /interviews/:id                     -> { interview }
POST   /interviews                         -> { interview }  admin
PUT    /interviews/:id                     -> { interview }  admin
DELETE /interviews/:id                     -> 204            admin
POST   /interviews/:id/submit              -> { result }
GET    /results                            -> { results }
GET    /results/:id                        -> { result }
```

Students only see published interviews. Admins can see and edit drafts.

## cURL examples

```bash
curl -X POST localhost:4000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"a@test.com","password":"secret123"}'

curl -X POST localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"secret123"}'

curl localhost:4000/me -H "Authorization: Bearer <TOKEN>"
```

## Structure

```
backend/
├── prisma/schema.prisma
├── src/
│   ├── config/      # env, prisma client
│   ├── controllers/ # route handlers
│   ├── middleware/  # auth, error
│   ├── routes/      # express routers
│   ├── utils/       # jwt
│   ├── app.ts
│   └── server.ts
├── Dockerfile
└── .env.example
```
