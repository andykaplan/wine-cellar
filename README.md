# Cave Personnelle — Wine Label Scanner

A mobile-optimized wine journal. Photograph a label, get value, drinking window, and tasting notes. Saves your collection for future reference.

## Deploy to Vercel (one-time setup, ~15 minutes)

### 1. Get your Anthropic API key
Go to https://console.anthropic.com → API Keys → Create Key. Copy it.

### 2. Put this folder on GitHub
```bash
cd wine-cellar
git init
git add .
git commit -m "Initial commit"
# Create a new repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/wine-cellar.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your `wine-cellar` repo
4. Under "Environment Variables", add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from step 1
5. Click Deploy

### 4. Add to your iPhone home screen
1. Open the Vercel URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Name it "Cave Personnelle" and tap Add

That's it — it works like a native app.

## Local development
```bash
cp .env.example .env.local
# Edit .env.local and add your API key
npm install
npm run dev
# Open http://localhost:3000
```
