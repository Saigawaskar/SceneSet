# SceneSet Project Guide

**Project:** SceneSet - Plan Together, Stress Less  
**Project author:** Sai Sunil Gawaskar  
**Project type:** Full-stack group planning web app

## 1. Project in one minute

SceneSet helps a group turn a vague idea like “we should hang out” into an organized plan. Members can suggest dates and places, vote, share an invite, add an itinerary, record shared expenses, and see an estimated equal split.

**Why I made it:** Group plans often get lost in long chats. People repeat dates, place ideas, and payment details across messages. I made SceneSet to keep those decisions together in one private, easy-to-use place.

**Short presentation summary:** “I built SceneSet as a full-stack group-planning app. The React frontend talks to an Express API, which stores accounts and plans in MongoDB. Members can vote, coordinate an itinerary, and track shared costs.”

## 2. Features and what they are for

| Feature | What it does / why it is useful |
|---|---|
| Accounts and sign-in | Lets each person have a private account. Passwords are stored as bcrypt hashes, not plain text. |
| Dashboard | Shows a member's scenes, people, status, and planning activity. |
| Plan Pulse | Estimates readiness from date/place voting and suggests a next action, such as getting more votes. |
| Create a scene | Records the event name, type, budget, date ideas, and place ideas. |
| Voting | Members vote on date and place choices. They can change or remove their vote. |
| Invite links | Lets a signed-in user invite others. Links expire after 30 days. |
| Share options | Copies the invite or opens WhatsApp, SMS, email, or the device share menu where supported. |
| Itinerary | Gives the group a shared timeline of activities, locations, and notes. |
| Expense tracker | Records who paid. The app estimates each person's equal share and suggested reimbursements. It does not transfer money. |
| Notifications | Shows plan joins, votes, and itinerary/plan updates inside the app. |
| Help chat | Gives built-in automated answers to common questions at any time. This is not a live human-agent service. |
| Day/night mode | Switches the interface theme and remembers the choice on that device. |
| Responsive layout | Adapts the dashboard, navigation, and plan screens to mobile and desktop. |
| Creator animation | Displays an animated “Made by Sai Sunil Gawaskar” credit. |

## 3. How it is made

- **Frontend:** React 18, Vite, React Router, Lucide icons, and CSS.
- **Backend:** Node.js and Express REST API.
- **Database:** MongoDB with Mongoose models.
- **Authentication:** bcrypt password hashing, signed JWTs, and HTTP-only cookies.
- **Validation:** Zod validates API request data.
- **Tests:** Node's test runner, Supertest, and mongodb-memory-server for integration tests.

### Main request flow

1. A person uses a page in the React client.
2. The client sends a request to the Express API under `/api`.
3. The API checks the session and validates the request.
4. Mongoose reads or updates MongoDB.
5. The API returns JSON and the client refreshes the visible data.

### Main data collections

- **User:** name, normalized email, password hash, avatar color.
- **Plan:** owner, members, event details, date/place choices and votes, status, invite expiry, and itinerary.
- **Expense:** plan, amount, category, payer, and creator.
- **Notification:** recipient, message, related plan, and read status.

## 4. Start the demo on Windows

Open PowerShell in the project folder:

```powershell
cd "$HOME\OneDrive\Desktop\SceneSet-Project"
npm install
```

Start the demo API in one terminal:

```powershell
npm run demo
```

Start the frontend in a second terminal:

```powershell
npm run dev:client
```

Open the Local URL printed by Vite. It is normally `http://localhost:5173`; if that port is already in use, Vite prints another port such as `5174`.

**Demo sign-in**

- Email: `demo@sceneset.app`
- Password: `SceneSetDemo2026!`

The demo seeds sample members, scenes, votes, expenses, itinerary entries, and notifications. Its MongoDB server is temporary and runs in memory. Stopping `npm run demo` resets this demo data. It will not appear in MongoDB Compass.

## 5. Use persistent local MongoDB

Install MongoDB Community Server and MongoDB Compass. Start the MongoDB service, then in PowerShell copy the backend example settings:

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` and set a unique `JWT_SECRET` with at least 32 characters. Keep the local URI:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sceneset
JWT_SECRET=replace-this-with-a-long-random-secret-of-32-characters-or-more
CLIENT_URL=http://localhost:5173
COOKIE_NAME=sceneset_token
COOKIE_SAME_SITE=lax
```

For a frontend on port `5174`, add that exact origin to `CLIENT_URL`, separated by a comma. Do not share or commit `server/.env`.

From the project root, run:

```powershell
npm run dev
```

This starts the regular API and frontend. Register an account and create plans; those records will be stored in the MongoDB database named `sceneset`.

To view persistent data in MongoDB Compass, connect to:

```text
mongodb://127.0.0.1:27017
```

Then open the `sceneset` database and its `users`, `plans`, `expenses`, and `notifications` collections. The demo account/data from `npm run demo` is separate and temporary; running the regular server does not automatically copy it into this database.

## 6. Deploy online

The included deployment setup is for **MongoDB Atlas + Render (API) + Vercel (frontend)**. Use HTTPS URLs in production.

### A. Create the database

1. Create a MongoDB Atlas project and cluster.
2. Create a database user and copy the connection string. Replace its password placeholder with the database user's password.
3. Allow the Render service to reach Atlas using Atlas Network Access. Do not publish database credentials in this guide or in frontend variables.

### B. Deploy the API to Render

1. Push the project to GitHub without any `.env` files.
2. In Render, create a Web Service from the repository. Set **Root Directory** to `server`.
3. Use build command `npm install` and start command `npm start`.
4. Set health-check path to `/api/health`.
5. Add these Render environment variables:

```text
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a unique random secret, at least 32 characters>
CLIENT_URL=https://<your-frontend-domain>
COOKIE_NAME=sceneset_token
COOKIE_SAME_SITE=none
```

Render supplies the `PORT` value. Do not put the API secret or MongoDB URI in a `VITE_*` variable. After deployment, check `https://<your-api-domain>/api/health`; it should return a JSON status of `ok`.

### C. Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Set the Vercel **Root Directory** to `client`.
3. Set the frontend environment variable:

```text
VITE_API_URL=https://<your-api-domain>/api
```

4. Deploy. `client/vercel.json` already provides the single-page-app route rewrite.
5. Update Render's `CLIENT_URL` to the exact Vercel origin, with no extra path, and redeploy the API if needed.
6. Test registration, login, plan creation, invitations, voting, expenses, itinerary, notifications, and logout in a second browser/account.

The API uses secure cookies in production. `COOKIE_SAME_SITE=none` is needed for unrelated Render/Vercel domains, and both services must use HTTPS. Custom frontend and API subdomains under one site can be more reliable when browsers restrict third-party cookies.

## 7. Commands and checks

Run from the project root:

```powershell
npm install
npm run dev
npm run build
npm test
```

`npm run build` checks the production frontend bundle. `npm test` runs backend tests. The first integration-test run may download a MongoDB test binary.

## 8. Important limitations and safety

- SceneSet calculates equal expense shares but does not process payments or move money.
- Help chat answers common questions with built-in rules; it is not a live staffed support desk or an external AI service.
- Email, SMS, and push notifications are not configured. SMS/email share links open the user's own messaging app.
- The current demo database is temporary. Use the regular API with local MongoDB or Atlas for persistent records.
- Use a strong, private `JWT_SECRET`; never commit `.env` files or publish the Atlas URI/password.
- This is a learning/project app, not a security-audited commercial payment service.

## 9. Suggested project explanation

“I chose group planning because coordinating a date, venue, and shared costs through chat can get confusing. I designed SceneSet to put those tasks in one place. I used React for the interface, Express for the API, and MongoDB for flexible plan and member data. The server protects private plans with authentication and membership checks. The equal-split feature is an estimate only; it does not move money.”

For a presentation, be ready to explain the parts you worked on and how the API, database, and authentication fit together. If your school requires disclosure of coding tools or assistance, follow its rules.
