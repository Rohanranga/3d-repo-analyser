# 🚀 How to Run CodeSonar

## Prerequisites

Before running the project, make sure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Git** - [Download here](https://git-scm.com/)
3. **GitHub Personal Access Token** - [Create here](https://github.com/settings/tokens)
4. **Google Gemini API Key** - [Get here](https://aistudio.google.com/app/apikey)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Rohanranga/codesonar.git
cd codesonar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` and add your API keys:

```env
GITHUB_TOKEN=your_github_personal_access_token_here
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here
```

**How to get these keys:**

- **GitHub Token**: Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens) → Generate new token (classic) → Select `repo` scope
- **Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API Key

### 4. Run the Development Server

```bash
npm run dev
```

The app will start on **http://localhost:3000** (or 3001 if 3000 is in use)

### 5. Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

## 🎯 How to Use

1. **Enter a GitHub Repository URL**
   - Example: `https://github.com/vercel/next.js`

2. **Click "Analyze Repository"**
   - The app will fetch and analyze the code

3. **Explore the Results**
   - View architecture diagram
   - Browse code files
   - Read AI-generated explanations
   - Check tech stack and versions

## 📦 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🔧 Troubleshooting

### Port Already in Use

If port 3000 is already in use, the app will automatically use port 3001.

### API Rate Limits

If you hit GitHub or Gemini API rate limits:
- **GitHub**: Wait an hour or create a new token
- **Gemini**: Use a different API key or wait for quota reset

### Build Errors

If you see build errors:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

### Environment Variables Not Loading

Make sure:
1. File is named exactly `.env.local` (not `.env.local.txt`)
2. File is in the root directory (same level as `package.json`)
3. You restarted the dev server after adding the variables

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Deploy to Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- Railway
- Render
- Any platform supporting Node.js

## 📝 Project Structure

```
codesonar/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript types
├── public/              # Static files
├── .env.local          # Environment variables (create this)
├── package.json        # Dependencies
└── README.md           # Project documentation
```

## 🆘 Need Help?

- Check the [README.md](./README.md) for more details
- Open an issue on [GitHub](https://github.com/Rohanranga/codesonar/issues)
- Review the troubleshooting guide above

## ✅ Checklist

Before running for the first time:
- [ ] Node.js installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] GitHub token added to `.env.local`
- [ ] Gemini API key added to `.env.local`
- [ ] Dev server started (`npm run dev`)
- [ ] Browser opened to http://localhost:3000

Happy coding! 🎉
