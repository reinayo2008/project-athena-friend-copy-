# Athena local prototype

This folder contains the frontend, a FastAPI backend, and a local moderator
preview. For one-device testing, use `localhost`. For a temporary phone demo,
connect the phone and laptop to the same private Wi-Fi or hotspot and use the
laptop's local IPv4 address.

## First-time setup

Open PowerShell in this folder and install the dependencies:

```powershell
python -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
```

In `.env`, set `GEMINI_API_KEY`, `ATHENA_MODERATOR_USERNAME`,
`ATHENA_MODERATOR_PASSWORD`, and a long random `ATHENA_IDENTITY_PEPPER`. Generate a
pepper with `python -c "import secrets; print(secrets.token_urlsafe(32))"` and
keep it stable after creating accounts; changing it makes existing name digests
unmatchable. Set `ATHENA_COOKIE_SECURE=true` only when serving over HTTPS.
Change any credentials that were previously shared or exposed. Do not send
`.env` or put secrets in HTML or JavaScript.

The admin signs in at `moderator.html`, provisions a unique account name, and
shares the one-time setup code privately with that student. Students use
`student-access.html` to choose a password of at least 12 characters, then
sign in with their account name and password. Passwords and setup codes are
Argon2 hashed; the database stores a keyed account-name digest instead of the
name. Codes expire after 30 minutes. Names alone do not verify identity, so
use fake names until the school approves an identity-verification process.
Admins can suspend or restore account access. Suspension blocks login and chat
and invalidates active sessions. Student sign-in is required before chat;
conversations and messages are stored in the existing SQLite database and are
scoped to the authenticated account. Chat history is sent to Gemini to generate
replies. Sign-out does not delete server-side conversations; students can
delete conversations from the chat page. Old browser-only chats are not
automatically imported because they are not safely associated with an account.

## Start the app

In the first PowerShell terminal, from this folder, start the API so devices
on the local network can reach it:

```powershell
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8001
```

In a second PowerShell terminal, also from this folder, serve the frontend:

```powershell
python -m http.server 5173 --bind 0.0.0.0
```

On the laptop, open `http://127.0.0.1:5173/ATHENA.html`. To find its local
address in PowerShell, run `ipconfig` and look for the IPv4 address on the
active Wi-Fi or hotspot adapter. On the phone, open
`http://LAPTOP-IP:5173/ATHENA.html`, replacing `LAPTOP-IP` with that address.
The student sign-in page is at `http://LAPTOP-IP:5173/student-access.html`.
The moderator page is at `http://LAPTOP-IP:5173/moderator.html`. The health
check is `http://LAPTOP-IP:8001/health`. If Windows Firewall asks, allow Python
on private networks only. Stop each server with Ctrl+C in its terminal.

## Soft-launch on Render

`render.yaml` describes one Free FastAPI web service that serves the frontend
and API from the same HTTPS origin. The build copies the source HTML, CSS,
JavaScript, and image assets into `render_public`; it does not publish `.env`,
the SQLite database, or moderator logs. `render_public` is generated from the
source files during each build, so do not edit it to update the site. This uses
no paid persistent disk.

Render Free services spin down after 15 minutes without traffic and can take
about a minute to wake. Their local files are erased on spin-down, restart, or
redeploy. That includes student accounts and moderator records in this demo.
It also includes conversation history, so history is not durable on this
Render configuration.
Use fake names only; after a restart, the admin must provision the test account
again. Render also applies monthly free usage limits, so check the dashboard.

To deploy this project in its current repository subfolder, include
`.env.example` but exclude `.env`, `student_accounts.sqlite3`,
`moderator_data`, `render_public`, and Python cache files. Connect the
repository in Render using **New + → Blueprint** and set Blueprint Path to
`project athena(friend copy)/render.yaml`. The build and start commands change
into this project folder before running. Follow Render's
prompts for `GEMINI_API_KEY`, `ATHENA_MODERATOR_USERNAME`, and
`ATHENA_MODERATOR_PASSWORD`. The Blueprint generates `ATHENA_IDENTITY_PEPPER` and
sets the temporary data path and HTTPS-only moderator cookie. Replace any
previously exposed moderator credentials.

After deployment, Render provides an `onrender.com` URL. Open it for the home
page, `/health` for the service check, `/student-access.html` for student
access, and `/moderator.html` for admin access. The site and API use relative
same-origin URLs, so this setup needs no custom domain or CORS allowlist. A
school-owned domain can be connected later if school IT approves DNS changes.

This is only a restricted teacher demonstration setup. Do not use real
students' names or conversations until the school approves the service and
reviews authentication, data handling, retention, and safety procedures. The
service runs one instance; login sessions, SQLite accounts, and moderator
records are temporary and reset when the free service sleeps or restarts.

## WordPress domain preparation

WordPress normally hosts the website files, not this FastAPI Python server.
Keep the website and API as separate deployments: upload only the frontend
HTML, CSS, JavaScript, and assets to WordPress, and deploy `app.py` to a Python
ASGI host. Never upload `.env`, `moderator_data`, or API credentials to
WordPress.

Set `athena-config.js` to the HTTPS API address supplied by the Python host,
for example `https://api.your-domain.example`. In the API host's environment,
set `ATHENA_ALLOWED_ORIGINS` to the exact HTTPS WordPress site origin(s),
comma-separated if both the apex and `www` address are used. Also set
`ATHENA_COOKIE_SECURE=true` for HTTPS. Do not use `*` for credentialed CORS.

Before exposing the API publicly, replace the moderator credentials that were
previously present in the local `.env`. This prototype still needs a production
review for authentication, rate limiting, persistent sessions, privacy, and
safety handling. CORS is not access control, and this README does not mean the
app is ready for real student data.

## Private remote demo with Tailscale

For a remote teammate, install Tailscale on both computers and add only the
teammate to your private tailnet. Do not enable Funnel, port forwarding, or a
public tunnel. Start both servers with the LAN commands above. In PowerShell,
run `tailscale ip -4` on the laptop and give the teammate the resulting
`http://TAILSCALE-IP:5173/ATHENA.html` address. The moderator page is at
`http://TAILSCALE-IP:5173/moderator.html`. The teammate must be connected to
the same tailnet. Remove their access and stop both servers after the demo.

## Prototype limits

This login is a local demo only: sessions are kept in server memory and are
cleared when the backend restarts. The chat endpoint requires a student
session. Do not expose these servers to the internet or use real student
information. Public deployment still needs reviewed authentication, rate
limiting, persistent sessions, privacy controls, retention rules, and safety
handling. CORS is not access control.
Real deployment needs reviewed authentication, HTTPS, access controls, data
retention rules, and a plan for safety concerns.