# 🚀 Deploy MobiusAI NOW (Hackathon Quick Start)

## Fastest Path to Deployment (10 minutes)

### Prerequisites
- GitHub account
- GROQ API key ([Get it here](https://console.groq.com))

---

## Option 1: Railway (Recommended - Unlimited Timeout)

### 1. Deploy with One Click
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### 2. Add Environment Variables
After clicking "Deploy", add these:
```
DATABASE_URL=<Railway will auto-generate>
NEXTAUTH_SECRET=<Click 'Generate' button>
NEXTAUTH_URL=https://your-app.up.railway.app
GROQ_API_KEY=gsk_your_key_here
```

### 3. Done! 🎉
Your app will be live at: `https://your-app.up.railway.app`

---

## Option 2: Render (Free Tier, Good Performance)

### 1. Connect GitHub
1. Go to [render.com](https://render.com)
2. Sign up / Sign in
3. Click "New" → "Blueprint"
4. Connect your GitHub repo with this code

### 2. Auto-Deploy
Render will read `render.yaml` and:
- Create PostgreSQL database
- Deploy the app
- Set up environment variables

### 3. Add Your Keys
In Render dashboard, add:
- `GROQ_API_KEY`: Your GROQ key
- `NEXTAUTH_URL`: Your Render URL (e.g., https://mobiusai.onrender.com)

### 4. Done! 🎉
Wait 5-10 minutes for initial build.

---

## Option 3: Vercel (Fastest Deploy, But Limited Timeouts)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
cd /path/to/mobius
vercel
```

### 3. Add Environment Variables
```bash
# Get database from Neon (free): https://neon.tech
vercel env add DATABASE_URL

# Generate secret
vercel env add NEXTAUTH_SECRET
# Use: openssl rand -base64 32

# Your Vercel URL
vercel env add NEXTAUTH_URL
# Enter: https://your-app.vercel.app

# Your GROQ API key
vercel env add GROQ_API_KEY
```

### 4. Redeploy with Env
```bash
vercel --prod
```

### 5. Run Migrations
```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-neon-url"

# Run migrations
npx prisma migrate deploy
```

### 6. Done! 🎉

**⚠️ Note**: Vercel Free has 10s function timeout. Draft builds may fail. Upgrade to Pro ($20/mo) for 300s timeout, or use Railway/Render.

---

## Environment Variables Needed

### Essential
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://your-app-url.com
NEXTAUTH_SECRET=<random-32-char-string>
GROQ_API_KEY=gsk_your_groq_key
```

### Optional (have good defaults)
```bash
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_POLKADOT_ENDPOINT=wss://westend-rpc.polkadot.io
NEXT_PUBLIC_POLKADOT_CHAIN=Westend
```

---

## Get Your API Keys

### GROQ API Key (FREE)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up
3. Create API Key
4. Copy it (starts with `gsk_`)

### Database (FREE)
Choose one:
- **Neon**: [neon.tech](https://neon.tech) - Fastest
- **Supabase**: [supabase.com](https://supabase.com) - Good UI
- **Railway**: Auto-creates when deploying

---

## Verify Deployment

### 1. Test Homepage
Visit: `https://your-app-url.com`
Should see MobiusAI homepage

### 2. Create Account
Click "Sign In" → "Sign Up"
Create test account

### 3. Test AI Agent
1. Click "New Project"
2. Type: "create a simple token transfer app"
3. Wait ~2 minutes
4. Should see: Spec → Code → Draft → Launch

### 4. Success! 🎉

---

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct
- Ensure database accepts connections from your host
- For Neon: Enable "Pooler" connection

### "GROQ API key invalid"
- Regenerate key at console.groq.com
- Ensure it starts with `gsk_`
- Check for extra spaces

### "NextAuth error"
- Ensure `NEXTAUTH_URL` exactly matches your deployment URL
- Include `https://` and no trailing slash
- Redeploy after changing

### "Build timeout"
- Vercel Free: Upgrade to Pro or use Railway
- Railway/Render: No timeout issues

### "Draft build failed"
- Check function logs
- Ensure long timeout (Railway/Render: unlimited, Vercel Pro: 300s)
- First build creates cache (~8 min), subsequent builds are fast (~35s)

---

## Quick Command Reference

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Railway
```bash
railway up
```

### View Logs
```bash
# Vercel
vercel logs --follow

# Railway
railway logs

# Render
# View in dashboard
```

### Update Environment Variables
```bash
# Vercel
vercel env add KEY_NAME

# Railway
railway variables set KEY_NAME=value

# Render
# Update in dashboard
```

---

## Performance Tips

### Speed Up Builds
1. **Cache hits**: After first build, subsequent builds use cache (~35s)
2. **Pre-warm**: Create one project before demo to warm up cache
3. **Simple prompts**: "create a simple X" builds faster than complex prompts

### Optimize for Hackathon Demo
1. Deploy 1 hour before submission deadline
2. Test with 2-3 sample projects
3. Have screenshots/video as backup
4. Keep deployment URL handy

---

## Next Steps

After deployment:
1. ✅ Test thoroughly
2. ✅ Create demo account
3. ✅ Practice demo (see `HACKATHON_DEMO_GUIDE.md`)
4. ✅ Record backup video
5. ✅ Add URL to hackathon submission

---

## Need Help?

**Quick Fixes**:
- Check logs first
- Verify all env vars are set
- Try Railway if Vercel times out
- Use backup video if live demo fails

**Resources**:
- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `HACKATHON_DEMO_GUIDE.md` - Demo script
- Vercel logs: `vercel logs`
- Railway logs: `railway logs`

---

## You're Almost There! 🎯

Pick a platform:
- **Railway** - Best for hackathons (unlimited timeout, free)
- **Render** - Solid alternative (free tier)
- **Vercel** - Fastest deploy (but upgrade to Pro for draft builds)

Click deploy, add your keys, and you're live! 🚀

Good luck with your hackathon! 🍀

