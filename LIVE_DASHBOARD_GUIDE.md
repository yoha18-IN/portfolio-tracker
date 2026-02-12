# 📊 Live Dashboard Setup Guide

Your portfolio tracker now has a **LIVE DASHBOARD** with automatic price updates! 🚀

## ✨ New Features

### 1. **Auto-Refresh Prices**
- Prices automatically update every **30 seconds**
- No more manual refreshing needed!
- Works in the background while you view your portfolio

### 2. **Live Status Indicator**
```
🟢 LIVE • Updated 3:45:12 PM • Next: 28s
```
- **Green pulsing dot** = Auto-update is active
- **Updated time** = Last price fetch timestamp
- **Next countdown** = Seconds until next refresh

### 3. **Price Change Animations**
When prices update, you'll see:
- **↑ Green arrow** + pulse animation when price goes UP
- **↓ Red arrow** + pulse animation when price goes DOWN
- Animation lasts 2 seconds, then fades away

### 4. **Control Panel**
- **Auto-Update ON/OFF** button to toggle live updates
- **🔄 Refresh Now** button for immediate manual refresh
- Manual refresh resets the 30-second countdown timer

## 🔑 Setup for Real-Time Prices

### Current Status
Your app currently uses the **demo** token, which has rate limits and may not show real prices.

### Get FREE Real-Time Prices

#### Option 1: Finnhub API (Recommended) ⭐
**Best for live dashboard - 60 calls/minute free!**

1. Go to [finnhub.io/register](https://finnhub.io/register)
2. Sign up for a FREE account (no credit card needed)
3. Copy your API key
4. Add to your `.env` file:
   ```env
   FINNHUB_API_KEY=your_actual_api_key_here
   ```
5. Restart your dev server (`npm run dev`)

**Free Tier Benefits:**
- ✅ 60 API calls per minute
- ✅ Real-time stock quotes
- ✅ 30+ years of historical data
- ✅ Support for US stocks, crypto, forex

#### Option 2: AlphaVantage (Fallback)
You already have an AlphaVantage key configured, which works as a fallback if Finnhub fails.

**Limitations:**
- ⚠️ Only 25 requests per day (not ideal for live dashboard)
- Better used as a backup

### Without API Keys
The app will use **updated mock prices** for popular stocks like AAPL, GOOGL, MSFT, NVDA, etc.

## 🎯 How It Works

### Price Fetching Flow
```
1. Try Finnhub API (primary)
   ↓ (if fails)
2. Try AlphaVantage API (fallback)
   ↓ (if fails)
3. Use updated mock prices (Feb 2026)
```

### Update Cycle
```
Page Load → Fetch Prices → Wait 30s → Fetch Prices → Wait 30s → ...
                ↓
         (Show animations for changes)
```

### Visual Feedback
```
Price goes up:   $232.50 ↑  (green, pulsing)
Price goes down: $231.80 ↓  (red, pulsing)
No change:       $232.50    (normal)
```

## 📱 Usage

### For Portfolio Owners
1. Navigate to your portfolio page
2. The dashboard loads with current prices
3. Watch the "Next: XXs" countdown
4. See prices update automatically every 30 seconds
5. Green/red arrows flash when prices change
6. Click "Auto-Update OFF" if you want to pause updates
7. Click "🔄 Refresh Now" to fetch prices immediately

### For Portfolio Viewers (non-owners)
All the same live features work for public portfolios too!

## 🛠️ Technical Details

### Files Modified
1. **`components/PortfolioView.tsx`**
   - Added auto-refresh logic with `setInterval`
   - Added countdown timer
   - Added price change tracking and animations
   - Added live status indicators

2. **`lib/prices.ts`**
   - Enhanced to support Finnhub API with proper key
   - Added AlphaVantage fallback
   - Updated mock prices to Feb 2026
   - Better error handling

3. **`.env`**
   - Added `FINNHUB_API_KEY` configuration

4. **`README.md`**
   - Added live dashboard documentation
   - Setup instructions for API keys

5. **`.env.example`**
   - Updated with Finnhub API key template

### Performance Considerations
- **30-second refresh interval** balances freshness with API limits
- **Batch fetching** - all symbols fetched in one API call
- **State management** - efficient React state updates
- **No caching** - `cache: 'no-store'` ensures fresh data

### Browser Compatibility
- Works in all modern browsers
- Uses standard `setInterval` (no WebSockets needed)
- CSS animations for smooth visual feedback

## 🎨 UI Enhancements

### Color Coding
- 🟢 Green = Positive (gains, price increases)
- 🔴 Red = Negative (losses, price decreases)
- ⚪ Gray = Neutral (no data, loading)
- 🔵 Indigo = Actions (buttons, links)

### Animations
- **Pulsing dot** = `animate-pulse` for live indicator
- **Price flash** = 2-second color + pulse on change
- **Smooth transitions** = `transition-all duration-200`

## ❓ Troubleshooting

### Prices not updating?
1. Check if auto-update is ON (green button)
2. Check browser console for API errors
3. Verify your `FINNHUB_API_KEY` in `.env`
4. Restart your dev server after changing `.env`

### "Demo" token showing errors?
Get a free Finnhub API key (see setup instructions above)

### Prices show as "--"?
- Symbol might not be available in the API
- Try a common stock like AAPL, GOOGL, MSFT
- Check if the symbol is correct (e.g., "AAPL" not "Apple")

### Countdown timer not working?
- This is normal if you have no holdings
- Add some stocks to see the timer in action

## 🚀 Next Steps

1. **Get your Finnhub API key** for real live prices
2. **Add some stock holdings** to your portfolio
3. **Watch the magic happen** as prices update automatically
4. **Share your public portfolio** with the leaderboard

---

**Enjoy your live portfolio dashboard!** 📈✨
