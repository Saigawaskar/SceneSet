# SceneSet — Plan Together, Stress Less

A full-stack social planning app for turning “we should hang out” into an actual plan. Create a scene, invite people with one link, vote on dates and places, add shared expenses, see equal-split balances, and build a group itinerary.

## What is included

- Responsive React + Vite interface with dashboard, plan creation wizard, plan details, member chips, and mobile navigation.
- Express REST API backed by MongoDB/Mongoose.
- Register, login, logout, and current-user endpoints using `httpOnly` cookie sessions with signed JWTs and bcrypt password hashing.
- Private plans with owner/member authorization and expiring invite links.
- One vote per member per category (date and place); voting again on the selected option removes the vote.
- Expense tracking, equal-split participant balances, and suggested settle-up transfers. SceneSet calculates balances only; it does not transfer money.
- Shared itinerary with add/remove permissions.
- In-app notifications for joins, votes, plan changes, and itinerary updates.
- Backend unit tests and an API integration test suite using an in-memory MongoDB instance.

## Project structure

```text
SceneSet/
├── client/
│   ├── src/
│   │   ├── components/      # App shell, avatar stacks, toast messages
│   │   ├── context/         # Authentication state
│   │   ├── lib/             # API helper and display formatters
│   │   ├── pages/           # Auth, dashboard, create, detail, join, 404
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── models/          # User, Plan, Expense, Notification
│   │   ├── routes/          # REST endpoints
│   │   ├── utils/           # Error wrapper, invite code, settlement math
│   │   ├── app.js
│   │   └── index.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── render.yaml              # Optional Render API deployment blueprint
└── package.json             # Workspace scripts
```

## Requirements

- Node.js 20 or newer and npm.
- MongoDB Community Server locally **or** a MongoDB Atlas database.
- Git is recommended but not required.

## Run locally

### 1. Configure the backend

Open a terminal in the `SceneSet` folder:

```bash
cd server
```

Copy `.env.example` to `.env` (PowerShell):

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Edit `server/.env` and set:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sceneset
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
CLIENT_URL=http://localhost:5173
COOKIE_NAME=sceneset_token
COOKIE_SAME_SITE=lax
```

Start MongoDB before launching the API. If using Atlas, replace `MONGODB_URI` with the connection string from your Atlas project and permit your development IP in Atlas Network Access. Do not commit `.env` to GitHub.

### 2. Configure the frontend

Copy `client/.env.example` to `client/.env`:

```powershell
Copy-Item client/.env.example client/.env
```

Default frontend API URL is `http://localhost:5000/api`. Change `VITE_API_URL` only if your API has a different local address. Vite variables are public client config; never put secrets in `VITE_*` variables.

### 3. Install and start

From the repository root:

```bash
npm install
npm run dev
```

Vite will show the frontend URL (normally `http://localhost:5173`); the API runs at `http://localhost:5000`. If you prefer separate terminals:

```bash
npm run dev --workspace sceneset-server
npm run dev --workspace sceneset-client
```

Open the frontend URL, create an account, create a scene, and open the invite link in a second browser/profile to test the guest flow. The app has no seeded demo account, so register your own test users.

### 4. Production build and tests

```bash
npm run build
npm test
```

`npm test` runs settlement/invite-code unit tests and the API integration tests. The integration suite uses `mongodb-memory-server`, which downloads a MongoDB binary the first time it runs if a compatible binary is not already cached. Internet access may be needed on that first run. The app itself uses your local/Atlas MongoDB connection, not the test database.

## Database schema (Mongoose)

### `User`

- `name`, `email` (unique, normalised to lowercase), `passwordHash`, `avatarColor`, `createdAt`.
- Password hashes are excluded from ordinary database reads and API JSON responses.

### `Plan`

- `title`, `description`, `eventType`, `owner`, `members[]`, `budget`, `currency`, `status`, `createdAt`, `updatedAt`.
- `dateOptions[]` and `placeOptions[]` each contain a display value and `voters[]` user IDs.
- `itinerary[]` contains a title, location, start time, notes, creator and creation time.
- `inviteCode` and `inviteExpiresAt` support a shareable invite for 30 days.

### `Expense`

- `plan`, `description`, `category`, `amount`, `paidBy`, `createdBy`, `createdAt`.
- Every expense is split equally across current plan members when the summary is calculated. Balances are recalculated from the stored expense list, so no stale total needs to be stored.

### `Notification`

- `user`, `type`, `title`, `message`, optional `plan`, `readAt`, `createdAt`.

## API endpoints

All endpoints are prefixed with `/api`. Protected endpoints require the browser session cookie.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API health check |
| POST | `/auth/register` | Create an account and sign in |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Clear session cookie |
| GET | `/auth/me` | Current user |
| GET | `/plans` | List plans the user belongs to |
| POST | `/plans` | Create a plan |
| GET | `/plans/:id` | Plan details, expenses, balances and settle-up suggestions |
| PATCH | `/plans/:id` | Owner updates title, description, budget or status |
| DELETE | `/plans/:id` | Owner deletes plan and linked expenses/notifications |
| POST | `/plans/:id/invite` | Get the shareable invite URL |
| POST | `/plans/join/:code` | Join a plan from an invite code |
| POST | `/plans/:id/votes` | Add, change or remove a date/place vote |
| POST | `/plans/:id/itinerary` | Add itinerary item |
| PATCH | `/plans/:id/itinerary/:itemId` | Update itinerary item |
| DELETE | `/plans/:id/itinerary/:itemId` | Remove itinerary item (creator or owner) |
| POST | `/plans/:id/expenses` | Add expense |
| DELETE | `/plans/:id/expenses/:expenseId` | Remove expense (creator or owner) |
| GET | `/notifications` | List recent notifications and unread count |
| PATCH | `/notifications/:id/read` | Mark one notification as read |
| POST | `/notifications/read-all` | Mark all notifications as read |

Errors use a consistent JSON shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A readable explanation"
  }
}
```

## Important implementation notes

- Session cookies are `httpOnly`, `sameSite=lax`, and `secure` in production. HTTPS is required when deployed.
- `JWT_SECRET` must be set to a unique random secret with at least 32 characters.
- CORS only allows origins configured in `CLIENT_URL`. For multiple trusted origins, separate them with commas.
- Plan membership is checked on private plan, voting, expense, and itinerary endpoints. Owner-only operations are checked on the server.
- The invite URL lets a signed-in account join a plan. Invite links expire after 30 days.
- The settlement calculation assumes an equal split of each expense among all plan members. It doesn't support custom shares or refunds yet.
- Notifications are in-app database notifications. Email, SMS and push notifications are not configured.
- Map integration, payment processing, and third-party AI are intentionally not required, so the core app can run without paid APIs.

## Deployment guide

### API (Render + MongoDB Atlas)

1. Push the `SceneSet` directory to a private or public GitHub repository; keep `.env` out of Git.
2. Create a MongoDB Atlas database and save its connection string.
3. In Render, create a Web Service using `server` as its root directory, build command `npm install`, start command `npm start`, and health check `/api/health`. `render.yaml` is included as a starting point.
4. Set `MONGODB_URI`, a strong `JWT_SECRET` (32+ random characters), `CLIENT_URL` to the deployed frontend origin, `NODE_ENV=production`, and `COOKIE_NAME=sceneset_token`. Set `COOKIE_SAME_SITE=none` when the frontend and API are on different sites (for example, default Vercel and Render domains); the API will then set `Secure` cookies. If both are on custom subdomains of the same site, `lax` is usually preferable.
5. Confirm the deployed API's `/api/health` endpoint returns `{ "status": "ok" ... }`.

### Frontend (Vercel)

1. Import the repository into Vercel and set the project root to `client`.
2. Set `VITE_API_URL` to the deployed API's full API base URL, for example `https://your-api.example.com/api`.
3. Set the API's `CLIENT_URL` to the exact frontend origin (for example `https://your-project.vercel.app`) so credentialed CORS requests are accepted.
4. Deploy, then test register/login, creating a scene, invitation/join in another account, voting, expense settlement, itinerary updates, and logout.
5. Since auth uses cookies, deploy the frontend and API on compatible HTTPS domains and verify cookies are accepted by your browser. For unrelated cross-site domains, use `COOKIE_SAME_SITE=none` with HTTPS; browsers that block third-party cookies can still restrict this setup, so custom subdomains under one domain are more reliable for production.

## Before submitting to college

- Replace project metadata with your details and add screenshots of the working pages.
- Demonstrate two accounts: creator and invited member.
- Explain the schema relationships, authorization checks, vote toggling, and equal expense split in your viva.
- Test invalid login, duplicate registration, a non-member trying to access a plan, invalid invite codes, and deleting an expense you don't own.
- Do not describe this as a production-audited service; it is a final-year project foundation that still needs deployment-specific review and more extensive testing before real-world commercial use.
