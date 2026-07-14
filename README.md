<div align="center">

<img src="frontend/favicon.png" alt="FoodBridge" width="100" />

# FoodBridge

*Rescue surplus food. Warm hearts. End waste.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=render&logoColor=white)](https://foodbridge-dsqb.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge)](LICENSE)

> Built in **48 hours** at **Hackathon 3.0** · Parul University, Vadodara · January 2026

</div>

---

## The Problem

Every day, restaurants discard perfectly good food while families nearby go hungry.
**1.3 billion tonnes** of food is wasted globally every year.
**828 million people** go to bed hungry every night.

FoodBridge closes that gap — in real time.

---

## How It Works

```
Restaurant posts surplus food
        |
        |  real-time Socket.io broadcast
        v
NGO sees it instantly and claims it
        |
        |  government tracking logged automatically
        v
Delivery tracked live on map
        |
        v
Food reaches families in need
        |
        |  if inedible —
        v
Compost center collects and diverts from landfill
```

---

## Roles

| Role | Portal | Responsibility |
|------|--------|---------------|
| Restaurant | `restaurant.html` | Donate surplus food with name, qty, location & GST |
| NGO | `ngo.html` | Browse edible listings by location & claim in one click |
| Compost Center | `compost.html` | Collect non-edible food, keep it out of landfills |
| Admin | `admin.html` | Verify users, monitor all donations, manage platform |

---

## Features

```
JWT Authentication      →  Secure login for all 4 roles, bcrypt hashed passwords
Smart Food Routing      →  Edible (cooked/raw/packaged) → NGO | Non-edible → Compost
Real-time Updates       →  Socket.io broadcasts every new donation instantly
Live Delivery Tracking  →  GPS coords, speed, heading, ETA, route history
Distance Calculator     →  Haversine formula computes km remaining to delivery
Security Stack          →  Helmet, Rate Limit, XSS, NoSQL injection, HPP protection
Custom Firewall         →  IP blocklist + URL scanner (SQLi / XSS keyword detection)
Government Logging      →  Every claimed donation tagged with governmentLog field
GST Verification        →  Restaurant donations require a GST number
Fullstack One Repo      →  Backend serves all frontend pages — one deploy, done
```

---

## Project Structure

```
foodbridge/
│
├── frontend/
│   ├── index.html           Landing page
│   ├── auth.html            Login & Register
│   ├── role.html            Role selection
│   ├── dashboard.html       User dashboard
│   ├── restaurant.html      Donate food portal
│   ├── ngo.html             Browse & claim food
│   ├── compost.html         Compost collection portal
│   ├── admin.html           Admin moderation panel
│   ├── location.html        Live delivery tracking map
│   ├── style.css            Global styles
│   ├── auth.css             Auth page styles
│   ├── script.js            Frontend logic
│   ├── admin.js             Admin panel logic
│   ├── favicon.png
│   └── assets/
│       ├── hero.png
│       ├── food.jpeg
│       └── impact.png
│
└── backend/
    ├── server.js            Express + Socket.io + static file serving
    ├── models/
    │   ├── User.js          name, email, password (hashed), role, gstNumber, isVerified
    │   ├── Food.js          foodName, quantity, condition, status, donor, governmentLog
    │   └── Tracking.js      currentLocation, routeHistory, ETA, distanceRemaining
    ├── routes/
    │   ├── authRoutes.js    Register, login
    │   ├── foodRoutes.js    Full food lifecycle
    │   ├── adminRoutes.js   User management
    │   └── tracking.js      GPS updates and route history
    ├── middleware/
    │   ├── authMiddleware.js    JWT verification
    │   ├── roleCheck.js         Role-based access guard
    │   └── firewall.js          IP blocker + SQLi/XSS URL scanner
    ├── .env                 Not committed
    └── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier or local MongoDB

### Run Locally

```bash
# Clone
git clone https://github.com/Techie192/foodbridge.git
cd foodbridge/backend

# Install
npm install

# Configure
cp .env.example .env
# fill in your values

# Start
npm run dev       # development with hot reload
npm start         # production
```

Open `http://localhost:5001` or visit the [live demo](https://foodbridge-dsqb.onrender.com).

---

## Environment Variables

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/foodbridge
PORT=5001
JWT_SECRET=make_this_long_and_random
ADMIN_SECRET=secret_used_to_create_admin_accounts
NODE_ENV=development
FRONTEND_URL=https://foodbridge-dsqb.onrender.com
```

> `.env` is already in `.gitignore` — it will never reach GitHub.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register — roles: `restaurant` / `ngo` / `compost` / `admin` |
| `POST` | `/login` | Authenticate, returns JWT + role |

### Food — `/api/food`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/` | Restaurant | Donate food — qty min 3, includes GST |
| `GET` | `/my-donations` | Restaurant | My donation history |
| `GET` | `/ngo` | NGO / Admin | All edible food listings |
| `GET` | `/ngo/:location` | NGO | Filter edible food by location |
| `GET` | `/compost` | Compost / Admin | Non-edible food listings |
| `PUT` | `/claim/:id` | NGO | Claim listing, sets governmentLog |
| `PUT` | `/collect/:id` | Compost | Mark food as collected |
| `DELETE` | `/:id` | Admin | Delete a donation |

### Tracking — `/api/tracking`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/create` | Create tracking session |
| `POST` | `/update` | Push GPS update with speed, heading, auto ETA |
| `GET` | `/active` | All in-transit deliveries |
| `GET` | `/history/all` | Last 50 delivered or cancelled |
| `GET` | `/:id` | Specific delivery status |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List all users |
| `PUT` | `/verify/:id` | Verify a user account |
| `DELETE` | `/users/:id` | Delete a user |

---

## Socket.io Events

```js
// Server → All clients
'foodAdded'       // new donation posted
'newDonation'     // full food object broadcast
'foodUpdated'     // food claimed, collected, or deleted
'location:update' // GPS update with ETA and distance

// Client → Server
socket.emit('location:subscribe',   trackingId)   // join delivery room
socket.emit('location:unsubscribe', trackingId)   // leave delivery room
```

---

## Security

```
Request comes in
      |
      v
  helmet()               Secure HTTP headers
  mongoSanitize()        Strips $ and . — blocks NoSQL injection
  xss()                  Sanitizes HTML in request body
  hpp()                  Blocks duplicate query parameters
  ipBlocker              Checks against IP blocklist
  URL scanner            Blocks SQLi / XSS keywords in URLs
  rateLimit()            100 requests per IP per 15 minutes
      |
      v
  authMiddleware         JWT verification
  roleCheck()            Role-based route guard
      |
      v
  Route Handler
```

---

## Food Lifecycle

```
Condition determines routing:

  cooked | raw | packaged | edible
      └── visible to NGO  →  claimed  →  status: "claimed"

  compost | feed | non-edible
      └── visible to Compost Center  →  collected  →  status: "collected"

Status flow:
  "available"  →  "claimed"  →  "collected"
```

---

## Deployment

### Render (Backend + Frontend)

```
Root directory  :  backend/
Build command   :  npm install
Start command   :  node server.js
Env vars        :  add via Render dashboard
```

No separate frontend deployment needed — `express.static('../frontend')` serves all HTML, CSS, and JS from the same Render instance.

### MongoDB Atlas

```
1. Create free M0 cluster
2. Network Access → allow 0.0.0.0/0
3. Paste SRV connection string as MONGO_URI
```

---

## Hackathon

| | |
|---|---|
| Event | Hackathon 3.0 |
| Organizer | Parul University, Vadodara |
| Date | January 23–24, 2026 |
| Duration | 48 hours |
| Theme | Social Impact · Food Waste Management |

---

## Developer

**Isha** · B.Tech CSE (Big Data Analytics) · Parul University, Vadodara

[![GitHub](https://img.shields.io/badge/GitHub-Techie192-181717?style=flat-square&logo=github)](https://github.com/Techie192)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Isha_Patel-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/isha-patel-ba4365314)

---

## License

Open source under the [MIT License](LICENSE).

---

<div align="center">
<br/>
<sub>Wasted food = Wasted lives. FoodBridge fixes that.</sub>
<br/>
<sub>Built with determination in 48 hours.</sub>
</div>
