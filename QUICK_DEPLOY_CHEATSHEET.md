# ⚡ QUICK DEPLOY CHEATSHEET

## 🎯 Deploy in 3 Steps (30 min total)

---

### STEP 1: Get Keys (5 min)

```bash
# 1. GROQ API Key (FREE)
# Go to: https://console.groq.com
# Create API Key → Copy (starts with gsk_)

# 2. Database URL (FREE)
# Go to: https://neon.tech
# Create project → Copy connection string

# 3. NextAuth Secret
openssl rand -base64 32  # Copy output
```

**Save these 3 things!** ⬆️

---

### STEP 2: Deploy to Railway (10 min)

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Go to project
cd /Users/rushikeshdeelippatil/Downloads/mobius

# Initialize
railway init

# Add database
railway add
# Choose: PostgreSQL

# Set env vars
railway variables set GROQ_API_KEY="<your-gsk-key>"
railway variables set NEXTAUTH_SECRET="<your-secret>"

# Get your URL
railway status
# Copy the URL (e.g., https://your-app.up.railway.app)

# Set NEXTAUTH_URL
railway variables set NEXTAUTH_URL="<your-railway-url>"

# Deploy!
railway up

# Open
railway open
```

---

### STEP 3: Init Database (2 min)

```bash
# Get database URL
railway variables get DATABASE_URL

# Set locally
export DATABASE_URL="<paste-url-here>"

# Run migrations
npx prisma migrate deploy
```

---

## ✅ Test (5 min)

1. Visit your Railway URL
2. Create account
3. Create project: "create a simple NFT minting app"
4. Wait ~2 minutes
5. Launch and test!

**If all works → SUBMIT!** 🎉

---

## 🐛 Quick Fixes

### Can't connect to database
```bash
railway variables get DATABASE_URL
# Verify it starts with postgresql://
```

### GROQ key invalid
```bash
# Regenerate at console.groq.com
railway variables set GROQ_API_KEY="new-key"
railway restart
```

### NextAuth error
```bash
railway variables get NEXTAUTH_URL
# Must match Railway URL exactly
# Include https:// and no trailing /
```

---

## 📞 Full Docs

- **START_HERE.md** - Complete guide
- **DEPLOYMENT_GUIDE.md** - Detailed instructions
- **HACKATHON_DEMO_GUIDE.md** - Demo script

---

## ⏱️ Timeline

- Get keys: 5 min
- Deploy: 10 min
- Init DB: 2 min
- Test: 5 min
- Practice: 10 min
- **Total: 32 minutes**

**GO!** 🚀

