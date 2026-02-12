# Portfolio Tracker - Setup & Testing Guide

## Overview

You now have a fully functional portfolio tracking web application built with:
- **Next.js 15** (App Router) with TypeScript
- **InstantDB** for real-time database
- **Tailwind CSS** for styling
- **Custom authentication** with email verification (6-digit code) + password
- **Mock stock price data** (can be replaced with real API)

## Prerequisites

- Node.js 18+ installed
- npm package manager

## Installation & Setup

### 1. Install Dependencies (Already Done)

The dependencies have been installed. If you need to reinstall:

```bash
npm install
```

### 2. Configure InstantDB

1. Go to [instantdb.com/dash](https://instantdb.com/dash) and create a free account
2. Create a new app
3. Copy your App ID
4. Open the `.env` file in the project root
5. Replace `your_app_id_here` with your actual InstantDB App ID:

```
NEXT_PUBLIC_INSTANTDB_APP_ID=your_actual_app_id_here
```

### 3. Configure Email (Resend) for Verification Codes

The app sends 6-digit verification codes by email for signup and password reset:

1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from [resend.com/api-keys](https://resend.com/api-keys)
3. Add to `.env`:

```
RESEND_API_KEY=re_your_key_here
```

**Development:** If `RESEND_API_KEY` is not set, the 6-digit code is logged to the server console instead of sending email.

**Optional:** Add `VERIFICATION_TOKEN_SECRET` (random string) for production. Add `EMAIL_FROM` for custom sender (e.g. `Portfolio Tracker <noreply@yourdomain.com>`).

### 4. Add InstantDB Entity for Verification Codes

In your [InstantDB Dashboard](https://instantdb.com/dash), add a new entity `verificationCodes` with attributes:
- `id` (string)
- `email` (string)
- `code` (string)
- `purpose` (string)
- `expiresAt` (number)
- `createdAt` (number)

### 5. (Optional) Configure Stock Price API

By default, the app uses mock prices. To use real stock prices:

1. Get a free API key from [alphavantage.co](https://www.alphavantage.co/)
2. In the `.env` file, add your API key:

```
STOCK_API_KEY=your_alpha_vantage_key_here
```

## Running the Application

### Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Testing the Application

### 1. Test User Registration

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up" or "Get Started"
3. **Step 1:** Enter your email (e.g. `test@example.com`) and click "Send verification code"
4. **Step 2:** Check your email (or server console if RESEND_API_KEY is not set) for the 6-digit code, enter it, and click "Verify code"
5. **Step 3:** Enter a password (8+ chars with letters and numbers) and optional display name, then click "Complete signup"
6. You should be redirected to the dashboard

### 2. Test Portfolio Creation

1. On the dashboard, click "Create Portfolio"
2. Fill in:
   - Portfolio Name: `My Tech Portfolio`
   - Description: `Long-term growth stocks`
   - Check "Make this portfolio public" to test leaderboard
3. Click "Create Portfolio"

### 3. Test Adding Holdings

1. On the portfolio page, click "+ Add Holding"
2. Add some test holdings:
   - Symbol: `AAPL`, Shares: `10`, Avg Buy Price: `150`
   - Symbol: `GOOGL`, Shares: `5`, Avg Buy Price: `120`
   - Symbol: `MSFT`, Shares: `8`, Avg Buy Price: `400`
3. Click "Add" for each
4. You should see:
   - Holdings table with current prices (mock data)
   - Performance metrics showing returns
   - Total portfolio value

### 4. Test Price Refresh

1. On a portfolio page with holdings
2. Click the "🔄 Refresh Prices" button
3. Prices will be fetched (currently using mock data)

### 5. Test Leaderboard

1. Navigate to "Leaderboard" from the top menu
2. You should see your public portfolio ranked
3. Rankings are based on return percentage

### 6. Test Portfolio Visibility Toggle

1. Go to your portfolio
2. Click "Make Private" or "Make Public"
3. Check the leaderboard - it should update accordingly

### 7. Test Logout and Login

1. Click "Log Out" in the top navigation
2. You'll be redirected to the home page
3. Click "Log In"
4. Enter your credentials
5. You should be logged back in

## Features Implemented

### ✅ Authentication
- Email verification with 6-digit code sent to inbox
- Sign up: Email → verify code → set password
- Log in: Email + password
- Forgot password: Email → verify code → set new password
- Secure password hashing with bcrypt
- Session-based authentication with HTTP-only cookies
- Protected routes with middleware

### ✅ Portfolio Management
- Create multiple portfolios
- Edit portfolio details
- Delete portfolios
- Toggle public/private visibility

### ✅ Holdings Management
- Add stock holdings with symbol, shares, and buy price
- Edit existing holdings
- Delete holdings
- View holdings in a clean table

### ✅ Performance Tracking
- Real-time portfolio value calculation
- Return calculations (dollar and percentage)
- Per-holding performance metrics
- Refresh prices on demand

### ✅ Social Features
- Public leaderboard
- Compare performance with other users
- Rankings based on return percentage
- View other users' public portfolios

### ✅ UI/UX
- Beautiful, modern design with Tailwind CSS
- Responsive layout (works on desktop and mobile)
- Loading states and error handling
- Clean navigation
- Intuitive forms

## Project Structure

```
Portfolio_Tracker/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── portfolios/        # Portfolio CRUD
│   │   ├── holdings/          # Holdings CRUD
│   │   ├── leaderboard/       # Leaderboard data
│   │   └── prices/            # Price fetching
│   ├── dashboard/             # User dashboard
│   ├── portfolio/             # Portfolio pages
│   ├── login/                 # Login page
│   ├── signup/                # Signup page
│   ├── leaderboard/           # Leaderboard page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/                # Reusable components
│   ├── Navbar.tsx
│   └── PortfolioView.tsx
├── lib/                       # Utility libraries
│   ├── instantdb.ts           # Database client & schema
│   ├── auth.ts                # Auth helpers
│   └── prices.ts              # Price service
├── middleware.ts              # Route protection
├── .env                       # Environment variables
├── package.json
└── README.md
```

## Known Limitations & Future Enhancements

### Current Limitations
- Mock price data (until API key configured)
- No rate limiting on auth endpoints
- InstantDB queries use client-side SDK (can be optimized)

### Potential Enhancements
1. **Auth Improvements**
   - Two-factor authentication
   - Social login (Google, etc.)

2. **Portfolio Features**
   - Historical performance charts
   - Sector breakdown
   - Dividend tracking
   - Transaction history

3. **Social Features**
   - Follow other users
   - Comments on portfolios
   - Portfolio sharing links
   - Challenges/competitions

4. **Analytics**
   - Risk metrics
   - Benchmark comparisons (vs S&P 500)
   - Asset allocation visualization
   - Performance reports

5. **Mobile App**
   - React Native companion app

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_INSTANTDB_APP_ID`
   - `RESEND_API_KEY` (for verification emails)
   - `VERIFICATION_TOKEN_SECRET` (random string for production)
   - `STOCK_API_KEY` (optional)
5. Deploy!

### Other Platforms

The app can also be deployed to:
- Netlify
- Railway
- Render
- Any platform supporting Next.js

## Troubleshooting

### "Portfolio not found" error
- Make sure you've configured InstantDB correctly
- Check that your App ID is correct in `.env`

### Auth not working
- Clear cookies and try again
- Verify InstantDB connection
- Check browser console for errors

### Prices not updating
- Mock prices are static by design
- Configure Alpha Vantage API key for real prices
- Check API rate limits if using real API

## Support

For issues or questions:
1. Check the [InstantDB docs](https://instantdb.com/docs)
2. Review the code comments
3. Check browser console for errors

## License

MIT

---

**Congratulations!** Your portfolio tracker is ready to use. Start by creating an account and adding your first portfolio!
