# 🚀 MobiusAI Deployment Roadmap

## Current Status ✅
- ✅ Code complete and tested locally
- ✅ GROQ API key configured
- ✅ Neon database configured
- ✅ All features working
- ✅ Deployment configs ready (Railway, Vercel, Render)

---

## 🎯 Phase 1: Deploy to Production (30 minutes)

### Step 1: Choose Your Platform

**Recommended: Railway** (Best for hackathons)
- ✅ Unlimited function timeouts
- ✅ Free tier with PostgreSQL
- ✅ Easy environment variable setup
- ✅ No credit card required

**Alternative: Render** (Good free tier)
- ✅ Free PostgreSQL
- ✅ Good performance
- ✅ Auto-deploy from GitHub

**Alternative: Vercel** (Fastest, but limited)
- ⚠️ Free tier: 10s timeout (draft builds will fail)
- 💰 Pro tier ($20/mo): 300s timeout (works great)

---

### Step 2: Deploy to Railway (Recommended)

#### A. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### B. Login to Railway
```bash
railway login
```
This will open your browser to authenticate.

#### C. Initialize Project
```bash
cd /Users/rushikeshdeelippatil/Downloads/mobius
railway init
```
- Choose: "Create new project"
- Name it: "mobiusai" (or your choice)

#### D. Add PostgreSQL Database
```bash
railway add
```
- Select: "PostgreSQL"
- Railway will auto-generate `DATABASE_URL`

#### E. Set Environment Variables
```bash
# Get your GROQ API key from .env.local
railway variables set GROQ_API_KEY="your-groq-key-here"

# Generate NextAuth secret
openssl rand -base64 32
# Copy the output, then:
railway variables set NEXTAUTH_SECRET="paste-secret-here"

# Get your Railway URL first
railway status
# Copy the URL (e.g., mobiusai-production.up.railway.app)

# Set NEXTAUTH_URL
railway variables set NEXTAUTH_URL="https://mobiusai-production.up.railway.app"
```

#### F. Deploy!
```bash
railway up
```

#### G. Run Database Migrations
```bash
# Get your database URL
railway variables

# Set it locally temporarily
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy
```

#### H. Open Your App
```bash
railway open
```

**🎉 Your app is now live!**

---

## 🎯 Phase 2: Verify Deployment (10 minutes)

### Checklist:
- [ ] Homepage loads: `https://your-app.up.railway.app`
- [ ] Sign up works: Create a test account
- [ ] Sign in works: Login with test account
- [ ] Create project: "create a simple token transfer app"
- [ ] Draft builds successfully (wait ~2-3 minutes)
- [ ] Draft opens in new tab
- [ ] No console errors

### Test Commands:
```bash
# View logs
railway logs

# Check status
railway status

# View environment variables
railway variables
```

---

## 🎯 Phase 3: Prepare for Hackathon Demo (20 minutes)

### A. Create Demo Account
1. Sign up with a clean email (e.g., `demo@mobiusai.com`)
2. Create 2-3 sample projects to warm up the cache
3. Test each project end-to-end

### B. Prepare Demo Script
See `HACKATHON_DEMO_GUIDE.md` for:
- What to show
- What to say
- Common questions & answers

### C. Record Backup Video (Optional but Recommended)
1. Screen record a full demo (5-10 minutes)
2. Upload to YouTube (unlisted)
3. Keep link as backup if live demo fails

### D. Take Screenshots
- Homepage
- Project creation flow
- Draft preview
- Launched app

---

## 🎯 Phase 4: Final Checklist (5 minutes)

### Before Submission:
- [ ] App is live and accessible
- [ ] All features work
- [ ] Demo account created
- [ ] Backup video recorded (optional)
- [ ] Screenshots ready
- [ ] Deployment URL saved
- [ ] README updated with live URL

### Submission Info:
- **Live URL**: `https://your-app.up.railway.app`
- **GitHub Repo**: (if submitting code)
- **Demo Video**: (if required)
- **Screenshots**: (if required)

---

## 🛠️ Troubleshooting

### "Build failed"
```bash
# Check logs
railway logs

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Build timeout (shouldn't happen on Railway)
```

### "Database connection error"
```bash
# Verify DATABASE_URL is set
railway variables

# Check if migrations ran
railway run npx prisma migrate deploy
```

### "GROQ API error"
```bash
# Verify API key is correct
railway variables

# Check key starts with "gsk_"
# Regenerate at console.groq.com if needed
```

### "NextAuth error"
```bash
# Ensure NEXTAUTH_URL matches your Railway URL exactly
railway variables set NEXTAUTH_URL="https://your-exact-url.up.railway.app"

# No trailing slash!
# Must include https://
```

---

## 📊 Performance Tips

### Speed Up Demo:
1. **Pre-warm cache**: Create 1-2 projects before demo
2. **Use simple prompts**: "create a simple X" builds faster
3. **First build**: ~2-3 minutes (creates cache)
4. **Subsequent builds**: ~30-60 seconds (uses cache)

### During Demo:
- Start with a simple project
- Explain what's happening while it builds
- Show the draft preview
- Launch the final app

---

## 🎬 Quick Deploy Commands

### Railway (Recommended)
```bash
railway login
railway init
railway add  # PostgreSQL
railway variables set GROQ_API_KEY="..."
railway variables set NEXTAUTH_SECRET="..."
railway variables set NEXTAUTH_URL="https://your-app.up.railway.app"
railway up
railway run npx prisma migrate deploy
railway open
```

### Render (Alternative)
1. Go to render.com
2. Connect GitHub repo
3. New → Web Service
4. Select repo
5. Add environment variables
6. Deploy

### Vercel (Fast but Limited)
```bash
vercel
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GROQ_API_KEY
vercel --prod
```

---

## 📝 Environment Variables Summary

### Required:
```bash
DATABASE_URL=postgresql://...          # Auto-generated by Railway
NEXTAUTH_URL=https://your-app...       # Your Railway URL
NEXTAUTH_SECRET=<random-32-chars>      # Generate with: openssl rand -base64 32
GROQ_API_KEY=gsk_...                   # From console.groq.com
```

### Optional (have defaults):
```bash
GROQ_MODEL=openai/gpt-oss-120b         # Already set
NEXT_PUBLIC_POLKADOT_ENDPOINT=wss://... # Already set
```

---

## 🎯 Next Steps

1. **Deploy now** (30 min) - Follow Phase 1
2. **Test everything** (10 min) - Follow Phase 2
3. **Prepare demo** (20 min) - Follow Phase 3
4. **Submit to hackathon** (5 min) - Follow Phase 4

---

## 🆘 Need Help?

### Quick Fixes:
- Check `railway logs` for errors
- Verify all env vars are set: `railway variables`
- Test locally first: `npm run dev`
- Check `DEPLOY_NOW.md` for platform-specific guides

### Resources:
- `DEPLOY_NOW.md` - Quick deployment guide
- `HACKATHON_DEMO_GUIDE.md` - Demo script
- `START_HERE.md` - Full deployment guide
- Railway docs: https://docs.railway.app

---

## ✅ You're Ready!

Everything is configured. Just deploy and you're live! 🚀

**Estimated Time**: 30-60 minutes total
**Difficulty**: Easy (just follow the steps)
**Cost**: FREE (Railway free tier)

Good luck with your hackathon! 🍀

