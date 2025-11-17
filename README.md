# MobiusAI 🚀

**AI-Powered Polkadot dApp Builder**

Build complete Polkadot decentralized applications from natural language prompts. MobiusAI is an autonomous AI agent that generates specifications, writes production-ready code, and deploys working dApps in minutes.

![MobiusAI](./public/logo.png)

## ✨ Features

- 🤖 **AI Code Generation**: Powered by GROQ API with Llama 3.3 70B
- ⛓️ **Polkadot Native**: Specialized in Polkadot.js API, wallet integration, and blockchain patterns
- 🎨 **Modern Stack**: Next.js 14 (App Router), TypeScript, React Query v5, TailwindCSS
- 🚄 **Fast Builds**: 10-15x faster with intelligent caching (35s vs 8min)
- 💬 **Conversational**: Chat with the AI to iterate and refine your dApp
- 🔐 **Secure**: NextAuth authentication with Polkadot wallet support
- 📦 **Production Ready**: Generates deployable, type-safe, tested code

---

## 🚀 Quick Deploy (For Hackathons)

### Deploy in 10 Minutes
See **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** for fastest deployment.

**One-Click Deploy Options**:
- **Railway** (Recommended): [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)
- **Render**: [One-click deploy](https://render.com)
- **Vercel**: `vercel --prod`

**Full Guide**: See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete instructions.

---

## 🏃 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- GROQ API key ([Get it free](https://console.groq.com))

### Quick Start

1. **Clone and Install**
```bash
git clone <your-repo-url>
cd mobius
npm install
```

2. **Set Up Environment**
```bash
# Create .env.local from example
cp .env.example .env.local
```

Edit `.env.local`:
```bash
# Database (use local PostgreSQL or Neon/Supabase)
DATABASE_URL="postgresql://user:password@localhost:5432/mobiusai"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# GROQ API
GROQ_API_KEY="gsk_your_key_here"
GROQ_BASE_URL="https://api.groq.com/openai/v1"
GROQ_MODEL="llama-3.3-70b-versatile"

# Polkadot (Westend testnet for development)
NEXT_PUBLIC_POLKADOT_ENDPOINT="wss://westend-rpc.polkadot.io"
NEXT_PUBLIC_POLKADOT_CHAIN="Westend"
NEXT_PUBLIC_POLKADOT_UNIT="WND"
NEXT_PUBLIC_POLKADOT_DECIMALS="12"
```

3. **Set Up Database**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Run Development Server**
```bash
npm run dev
```

5. **Open App**
Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 Usage

### 1. Create Account
- Sign up with email/password or connect Polkadot wallet

### 2. Start New Project
- Click "New Project" or start chatting
- Describe your dApp: *"create an NFT minting app"*

### 3. Watch AI Build
The AI agent will:
1. **Generate Spec** (~15s) - Analyze requirements and create technical specification
2. **Write Code** (~30s) - Generate all files: components, hooks, types, styles
3. **Build Draft** (~35s with cache) - Install dependencies and create preview
4. **Deploy** - Launch the working dApp

### 4. Iterate
- Chat to add features: *"add a gallery view"*
- Modify styling: *"make it dark mode"*
- Fix issues: *"the button isn't working"*

---

## 🏗️ Architecture

```
MobiusAI
├── Frontend (Next.js 14 App Router)
│   ├── Chat Interface
│   ├── Code Viewer
│   ├── Draft Preview
│   └── Live Deployment
├── AI Agent (GROQ API)
│   ├── Spec Generation
│   ├── Code Generation
│   ├── Validation
│   └── Iteration
├── Build System
│   ├── Template Injection
│   ├── Dependency Caching
│   ├── Hot Reloading
│   └── Preview Server
└── Polkadot Integration
    ├── Wallet Connection
    ├── Transaction Handling
    ├── Chain Queries
    └── Identity Lookups
```

---

## 📚 Documentation

- **[HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md)** - Complete hackathon submission (Inspiration, What it does, How we built it, Challenges, Accomplishments, What we learned, What's next)
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - Quick deployment for hackathons
- **[HACKATHON_DEMO_GUIDE.md](./HACKATHON_DEMO_GUIDE.md)** - Demo script and tips
- **[DRAFT_BUILD_OPTIMIZATION.md](./DRAFT_BUILD_OPTIMIZATION.md)** - Caching system details
- **[ALL_FIXES_COMPLETE.md](./ALL_FIXES_COMPLETE.md)** - System-wide fixes and improvements

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Framer Motion
- **State**: React Query v5, Zustand
- **UI Components**: Custom + shadcn/ui

### Backend
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **AI**: GROQ API (Llama 3.3 70B)
- **Blockchain**: Polkadot.js API

### Infrastructure
- **Deployment**: Vercel / Railway / Render
- **Database**: Neon / Supabase / Railway
- **Cache**: File-based node_modules cache
- **CI/CD**: GitHub Actions (optional)

---

## 🎮 Example Prompts

Try these to see MobiusAI in action:

1. **NFT Minting**: *"create an NFT minting app with metadata"*
2. **Token Transfer**: *"create a token transfer interface"*
3. **Voting dApp**: *"create a simple voting application"*
4. **Dashboard**: *"create a Polkadot token dashboard"*
5. **Crowdfunding**: *"create a crowdfunding platform"*

---

## 🔧 Configuration

### Change Polkadot Network
Edit environment variables:
```bash
# For mainnet
NEXT_PUBLIC_POLKADOT_ENDPOINT="wss://rpc.polkadot.io"
NEXT_PUBLIC_POLKADOT_CHAIN="Polkadot"
NEXT_PUBLIC_POLKADOT_UNIT="DOT"
NEXT_PUBLIC_POLKADOT_DECIMALS="10"
```

### Change AI Model
```bash
# Use different GROQ model
GROQ_MODEL="llama-3.1-70b-versatile"

# Or use OpenAI (requires code changes)
GROQ_BASE_URL="https://api.openai.com/v1"
GROQ_API_KEY="sk-your-openai-key"
GROQ_MODEL="gpt-4-turbo"
```

---

## 🚀 Performance

### Build Times
- **First build**: ~8 minutes (creates cache)
- **Subsequent builds**: ~35 seconds (10-15x faster!)
- **Cache hit rate**: ~95% for similar projects

### AI Response Times
- **Spec generation**: ~15 seconds
- **Code generation**: ~30 seconds
- **Total time to working app**: ~2 minutes

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style
- Update documentation
- Test thoroughly before submitting

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations (dev)
npx prisma migrate deploy # Run migrations (prod)
npx prisma studio        # Open Prisma Studio

# Maintenance
npm run cleanup:drafts   # Clean up old draft directories
npm run db:normalize     # Normalize email addresses
```

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built for Polkadot ecosystem
- Powered by GROQ Cloud
- Inspired by v0.dev and Bolt.new

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: your-email@example.com

---

## 🎯 Hackathon Submission

**📄 Full Submission**: See **[HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md)** for complete details including:
- Inspiration
- What it does
- How we built it
- Challenges we ran into
- Accomplishments we're proud of
- What we learned
- What's next for MobiusAI

**Quick Summary**:
- **Category**: Developer Tools / AI / Infrastructure
- **Demo**: [Live Demo URL - Add your Railway deployment URL]
- **Video**: [Demo Video URL - Add your demo video]
- **Repository**: https://github.com/patil1001/mobiusai

**Key Achievements**:
- ✅ Generates production-ready Polkadot dApps from natural language
- ✅ 10-15x faster builds with intelligent caching (35s vs 8min)
- ✅ Full Polkadot.js integration with wallet support
- ✅ Conversational iteration and refinement
- ✅ Zero-hallucination code generation with MCP integration
- ✅ Complete documentation and deployment guides

---

Made with ❤️ for the Polkadot community
