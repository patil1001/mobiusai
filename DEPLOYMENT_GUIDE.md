# MobiusAI - Hackathon Deployment Guide

Complete guide to deploy MobiusAI for hackathon judges to test.

## 🚀 Quick Deploy (15 minutes)

### Prerequisites
- [Vercel Account](https://vercel.com) (free tier works)
- [Neon Database](https://neon.tech) or any PostgreSQL provider (free tier works)
- [GROQ API Key](https://console.groq.com) (free tier works)

---

## Step 1: Set Up Database (5 min)

### Option A: Neon (Recommended - Free, Fast)
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the **Connection String** (starts with `postgresql://`)
4. Save it for later as `DATABASE_URL`

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the **Connection String** (Transaction pooler)
5. Save it as `DATABASE_URL`

### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create PostgreSQL database
3. Copy connection string
4. Save as `DATABASE_URL`

---

## Step 2: Get API Keys (3 min)

### GROQ API (AI Models)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Create an API Key
4. Save as `GROQ_API_KEY`

### NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```
Save as `NEXTAUTH_SECRET`

---

## Step 3: Deploy to Vercel (7 min)

### A. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### B. Deploy via CLI
```bash
cd /path/to/mobius
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Choose your account
- Link to existing project? **No**
- Project name? **mobiusai** (or any name)
- Directory? **.** (current directory)
- Override settings? **No**

### C. Add Environment Variables
After deployment, add these in Vercel Dashboard or via CLI:

```bash
# Database
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string

# NextAuth
vercel env add NEXTAUTH_URL
# Enter: https://your-app.vercel.app

vercel env add NEXTAUTH_SECRET
# Paste your generated secret

# GROQ API
vercel env add GROQ_API_KEY
# Paste your GROQ API key

# Optional: Add Polkadot config (defaults are fine for demo)
vercel env add NEXT_PUBLIC_POLKADOT_ENDPOINT
# wss://westend-rpc.polkadot.io

vercel env add NEXT_PUBLIC_POLKADOT_CHAIN
# Westend
```

### D. Redeploy with Environment Variables
```bash
vercel --prod
```

---

## Step 4: Initialize Database

### Option A: Via Vercel CLI
```bash
# Set DATABASE_URL locally for migration
export DATABASE_URL="your-postgresql-url-here"

# Run migrations
npx prisma migrate deploy
```

### Option B: Via Prisma Studio
```bash
npx prisma db push
```

### Option C: Via SQL (if Prisma fails)
```sql
-- Copy and run the migrations from prisma/migrations/ in your database console
```

---

## Step 5: Test Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. You should see the MobiusAI homepage
3. Try creating an account
4. Try creating a new project with a prompt like: "create a simple NFT gallery"
5. Watch the AI agent build it in real-time!

---

## 🎯 Hackathon Demo Setup

### For Judges
Share this URL: `https://your-app.vercel.app`

### Demo Prompts (Fast & Impressive)
1. **NFT Gallery**: "create an nft gallery app"
2. **Token Dashboard**: "create a polkadot token dashboard"
3. **Voting App**: "create a simple voting dapp"
4. **Transfer App**: "create a token transfer interface"

### Expected Timeline
- Prompt → AI generates spec: **~15 seconds**
- AI generates code: **~30 seconds**
- Draft builds: **~35 seconds** (with cache) or **~8 min** (first build)
- Total: **~1-2 minutes** for fully working app!

---

## 📊 Monitoring & Debugging

### View Logs
```bash
vercel logs
```

Or in Vercel Dashboard:
- Go to your project
- Click on Deployments
- Click on latest deployment
- View Function Logs

### Common Issues

#### Issue: "Failed to connect to database"
**Fix**: Check DATABASE_URL is correct and accessible
```bash
vercel env ls
```

#### Issue: "GROQ API key invalid"
**Fix**: Regenerate GROQ API key and update
```bash
vercel env rm GROQ_API_KEY
vercel env add GROQ_API_KEY
vercel --prod
```

#### Issue: "Draft build failed"
**Fix**: Check function timeout (should be 300s max on Vercel Pro, 10s on Free)
- Upgrade to Vercel Pro for hackathon ($20/month)
- Or use Railway/Render for longer timeouts

#### Issue: "NextAuth error"
**Fix**: Ensure NEXTAUTH_URL matches your deployment URL
```bash
vercel env add NEXTAUTH_URL production
# Enter: https://your-exact-url.vercel.app
vercel --prod
```

---

## 🔧 Advanced Configuration

### Enable Draft Building on Vercel
**Note**: Draft building requires long-running functions. Vercel Free tier has 10s timeout.

**Solutions**:
1. **Upgrade to Vercel Pro** ($20/month) - 300s timeout
2. **Use Railway** (free 500 hours/month) - unlimited timeout
3. **Use Render** (free tier) - unlimited timeout

### Railway Deployment (Alternative)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up

# Add environment variables
railway variables set DATABASE_URL=your-db-url
railway variables set NEXTAUTH_URL=your-railway-url
railway variables set NEXTAUTH_SECRET=your-secret
railway variables set GROQ_API_KEY=your-groq-key

# Done!
```

---

## 🎨 Customization

### Change App Name
Edit `package.json`:
```json
{
  "name": "your-hackathon-name"
}
```

### Change Polkadot Network
Default is Westend testnet. To use mainnet:
```bash
vercel env add NEXT_PUBLIC_POLKADOT_ENDPOINT
# wss://rpc.polkadot.io

vercel env add NEXT_PUBLIC_POLKADOT_CHAIN
# Polkadot

vercel env add NEXT_PUBLIC_POLKADOT_UNIT
# DOT

vercel --prod
```

---

## 📝 Environment Variables Checklist

Essential:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `NEXTAUTH_URL` - Your deployment URL
- ✅ `NEXTAUTH_SECRET` - Random secret (32+ chars)
- ✅ `GROQ_API_KEY` - GROQ API key

Optional (good defaults):
- ⭕ `GROQ_BASE_URL` - Default: `https://api.groq.com/openai/v1`
- ⭕ `GROQ_MODEL` - Default: `llama-3.3-70b-versatile`
- ⭕ `NEXT_PUBLIC_POLKADOT_ENDPOINT` - Default: `wss://westend-rpc.polkadot.io`
- ⭕ `NEXT_PUBLIC_POLKADOT_CHAIN` - Default: `Westend`

---

## 🏆 Hackathon Tips

### Make It Impressive
1. **Pre-warm the cache**: Create one project before demo
2. **Use fast prompts**: "create a simple [x]" builds faster than complex prompts
3. **Show the logs**: Open Vercel logs in another tab to show real-time AI building
4. **Have fallback**: Keep a video recording of successful build

### Demo Script (2 minutes)
1. **Intro** (15s): "MobiusAI builds full-stack Polkadot dApps from natural language"
2. **Prompt** (15s): Type "create an NFT minting app"
3. **Watch** (60s): Show spec generation → code generation → draft building
4. **Launch** (30s): Click Launch, show working app with wallet connection

### Backup Plan
If live demo fails:
1. Have screenshots/video ready
2. Show code in GitHub
3. Walk through the architecture

---

## 🚨 Troubleshooting Quick Fixes

```bash
# Reset everything
vercel --prod --force

# Clear build cache
rm -rf .next node_modules
npm install
vercel --prod

# Check environment
vercel env ls

# View real-time logs
vercel logs --follow
```

---

## 📞 Support

If deployment fails:
1. Check Vercel deployment logs
2. Check database connectivity
3. Verify all environment variables are set
4. Try Railway/Render as alternative

---

## ✅ Deployment Checklist

Before submitting:
- [ ] App deployed and accessible
- [ ] Database connected and migrations run
- [ ] Can create account
- [ ] Can create project with prompt
- [ ] AI agent runs successfully
- [ ] Draft builds (or shows informative error)
- [ ] Wallet connection works
- [ ] Tested on mobile
- [ ] Added project URL to hackathon submission
- [ ] Created demo video (backup)

---

## 🎉 You're Done!

Your MobiusAI instance is live at: `https://your-app.vercel.app`

Share this with judges and watch them build Polkadot dApps with AI! 🚀

**Next Steps**:
1. Test thoroughly
2. Create demo account
3. Prepare demo script
4. Record backup video
5. Submit to hackathon!

Good luck! 🍀

