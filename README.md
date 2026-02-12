# Portfolio Tracker

A Next.js web application for tracking stock portfolios and comparing performance with other users.

## Features

- User registration with email + 6-digit password
- Portfolio management (create, edit, delete)
- Stock holdings tracking with bulk import
- **Live Dashboard** with auto-updating prices every 30 seconds
- Real-time price change indicators (up/down arrows)
- Visual pulse animations when prices update
- Public leaderboard to compare performance
- Toggle auto-update on/off
- Manual refresh with countdown timer

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router) with TypeScript
- **Database**: InstantDB (real-time database)
- **Styling**: Tailwind CSS
- **Authentication**: Custom auth with bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Get your InstantDB App ID from [instantdb.com/dash](https://instantdb.com/dash) and add it to `.env`:
   ```
   NEXT_PUBLIC_INSTANTDB_APP_ID=your_app_id_here
   INSTANT_APP_ADMIN_TOKEN=your_admin_token_here
   ```

5. **(Optional but Recommended)** Set up live stock prices:
   
   The app uses Finnhub API for real-time stock prices. Without an API key, it falls back to updated mock prices.
   
   To get real live prices:
   
   a. Sign up for a free Finnhub API key at [finnhub.io/register](https://finnhub.io/register)
      - Free tier includes: 60 API calls/minute
      - No credit card required
   
   b. Add your API key to `.env`:
      ```
      FINNHUB_API_KEY=your_finnhub_api_key_here
      ```
   
   c. The dashboard will automatically refresh prices every 30 seconds when auto-update is enabled

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build for Production

```bash
npm run build
npm start
```

## Live Dashboard

The portfolio tracker includes a real-time live dashboard that automatically updates stock prices:

### Features:
- **Auto-refresh**: Prices update every 30 seconds when auto-update is enabled
- **Live indicator**: Green pulsing dot shows when auto-update is active
- **Price change animations**: 
  - Green ↑ arrow and pulse animation when price increases
  - Red ↓ arrow and pulse animation when price decreases
- **Countdown timer**: Shows seconds until next auto-refresh
- **Manual refresh**: Click "Refresh Now" to update immediately
- **Toggle control**: Turn auto-update on/off as needed
- **Last updated timestamp**: Shows exact time of last price update

### API Support:
- **Primary**: Finnhub API (60 calls/min free tier)
- **Fallback**: AlphaVantage API (if configured)
- **Ultimate fallback**: Updated mock prices

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main dashboard page
│   ├── portfolio/         # Portfolio pages
│   ├── leaderboard/       # Public leaderboard
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── prices/        # Stock price fetching
│   │   ├── holdings/      # Holdings CRUD
│   │   └── portfolios/    # Portfolio CRUD
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Utility libraries
│   ├── instantdb-server.ts # InstantDB server client
│   ├── prices.ts          # Price fetching logic
│   └── auth.ts            # Auth helpers
└── components/            # Reusable React components
    ├── PortfolioView.tsx  # Main portfolio table with live updates
    ├── BulkAddHoldings.tsx # Bulk import component
    └── Navbar.tsx         # Navigation bar
```

## Deployment

### Deploy to Vercel (Recommended)

This application is optimized for Vercel deployment.

#### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
3. All API keys ready (InstantDB, Finnhub, Exchange Rate API, Resend)

#### Deployment Steps

1. **Prepare Environment Variables**

   Collect all the required environment variables from your `.env` file:
   
   - `NEXT_PUBLIC_INSTANTDB_APP_ID` - Your InstantDB App ID
   - `INSTANT_APP_ADMIN_TOKEN` - Your InstantDB Admin Token
   - `FINNHUB_API_KEY` - Finnhub stock price API key
   - `STOCK_API_KEY` - AlphaVantage API key (optional fallback)
   - `RESEND_API_KEY` - Resend email API key
   - `EXCHANGE_RATE_API_KEY` - Exchange rate API key for ILS/USD conversion
   - `VERIFICATION_TOKEN_SECRET` - Random secret string for verification tokens

2. **Deploy via Vercel CLI**

   ```bash
   # Login to Vercel
   vercel login

   # Deploy to production
   vercel --prod
   ```

   Or simply run:
   ```bash
   vercel
   ```
   
   Follow the prompts to link your project.

3. **Configure Environment Variables in Vercel Dashboard**

   After deployment, go to your project in the Vercel Dashboard:
   
   - Navigate to **Settings** → **Environment Variables**
   - Add all the environment variables listed above
   - Set them for **Production**, **Preview**, and **Development** environments
   - Redeploy after adding environment variables

4. **Deploy via GitHub** (Alternative)

   - Push your code to a GitHub repository
   - Import the repository in Vercel
   - Configure environment variables in the Vercel Dashboard
   - Vercel will automatically deploy on every push to main

#### Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test user registration and login
- [ ] Test portfolio creation and management
- [ ] Verify stock price updates are working
- [ ] Check currency conversion (USD/ILS toggle)
- [ ] Test email verification codes
- [ ] Verify charts are rendering correctly
- [ ] Test cash holdings feature
- [ ] Check leaderboard functionality

#### Custom Domain (Optional)

To add a custom domain:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your domain and follow DNS configuration instructions

### Other Deployment Options

#### Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add all environment variables in Netlify Dashboard

#### Railway / Render / AWS

Follow their respective Next.js deployment guides and ensure all environment variables are configured.

## New Features

### 🎨 Performance Charts

- **Line Chart**: Historical portfolio value over time
- **Pie Chart**: Asset allocation visualization
- **Bar Chart**: Gains and losses per holding

### 💱 Currency Support

- Toggle between USD and ILS
- Live exchange rate updates (hourly)
- Persistent currency preference

### 💵 Cash Holdings

- Track uninvested money as CASH holdings
- Special UI treatment with icons
- Excluded from performance calculations

### 📊 Portfolio Snapshots

- Automatic historical tracking
- View performance trends over time

## License

MIT
