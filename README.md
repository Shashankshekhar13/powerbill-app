# PowerBill India ⚡

A full-stack electricity bill management application built with **React.js** and **Node.js/Express**, featuring Razorpay payment integration.

## Features

- 🔐 **User Authentication** — Sign up / Sign in with JWT-based auth
- 📊 **Dashboard** — Consumer info, bill summary, slab charges, bill components
- 📈 **Consumption History** — Visual bar chart of past electricity usage
- 💳 **Razorpay Payments** — Pay bills via Card, UPI, Net Banking, Wallets
- 🗄️ **MySQL Database** — Persistent storage for users, bills, and slab data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 19 |
| Backend | Node.js + Express |
| Database | MySQL |
| Auth | JWT (httpOnly cookies) |
| Payments | Razorpay |
| Passwords | bcrypt |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Shashankshekhar13/powerbill-app.git
cd powerbill-app

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=powerbill_db
JWT_SECRET=your_jwt_secret
PORT=5000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Setup Database

```bash
cd server
node scripts/setup-db.js    # Creates database + tables
node scripts/seed.js         # Inserts sample data
```

### 4. Run

```bash
# Terminal 1 — Backend
cd server && node server.js       # http://localhost:5000

# Terminal 2 — Frontend
cd client && npm start            # http://localhost:3000
```



## Project Structure

```
PowerBill/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.js       # Sign in / Sign up
│   │   │   ├── Dashboard.js      # Main dashboard
│   │   │   └── PaymentModal.js   # Razorpay checkout
│   │   ├── App.js                # Root component
│   │   ├── App.css               # All styles
│   │   └── index.css             # Base styles
│   └── public/
│       └── index.html
├── server/                  # Node.js backend
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js               # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js               # Signup, Signin, Logout
│   │   ├── dashboard.js          # Dashboard data API
│   │   └── payment.js            # Razorpay payment API
│   ├── scripts/
│   │   ├── setup-db.js           # DB creation script
│   │   └── seed.js               # Sample data script
│   └── server.js                 # Express app entry
└── .gitignore
```

## License

MIT
