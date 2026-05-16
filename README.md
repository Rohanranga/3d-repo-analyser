<div align="center">
  <img src="https://raw.githubusercontent.com/Rohanranga/3d-repo-analyser/main/public/logo.png" alt="CodeSonar Logo" width="150" height="150" onerror="this.style.display='none'"/>
  
  # CodeSonar (3D Repo Analyser)

  **Immersive AR/VR Codebase Visualization & AI Analysis Engine**

  [![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![Three.js](https://img.shields.io/badge/Three.js-XR-white?style=for-the-badge&logo=three.js)](https://threejs.org/)
  [![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
  [![Gemini AI](https://img.shields.io/badge/GenAI-Powered-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
</div>

<br />

## 🪐 Overview

**CodeSonar** is a cutting-edge developer tool that transforms complex, flat code repositories into **interactive, immersive 3D and AR/VR environments**. Built for high-performance spatial computing and powered by state-of-the-art AI, CodeSonar allows developers to physically navigate through their architecture, intuitively visualize dependencies, and interact with an AI pair-programmer contextually aware of the codebase's multidimensional topology.

Whether you're onboarding new engineers, architecting large-scale refactors, or debugging intricate dependency chains, CodeSonar turns abstract code into tangible space.

---

## 🌟 Key Features

- **Immersive 3D/XR Visualization:** Powered by `Three.js` and `@react-three/fiber`, navigate your repository structure as a sprawling, interactive 3D city or graph. Fully supports WebXR for AR/VR headsets.
- **AI-Powered Code Analysis:** Integrates seamlessly with **Google Generative AI** (Gemini) via `@genkit-ai` to automatically explain complex nodes, trace logic paths, and generate dynamic Mermaid.js architecture diagrams.
- **Cross-Platform Desktop App:** Packaged as a performant standalone desktop application via **Electron**, delivering native performance and deep OS integrations.
- **Dynamic Dependency Graphs:** Visualize spatial relationships between components, modules, and services in real-time.
- **High-Fidelity UI:** Sleek, modern interface styled with **Tailwind CSS v4** and animated via **Framer Motion**, ensuring a premium developer experience.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| **Core Framework** | Next.js 16+, React 19 |
| **3D & AR/VR** | Three.js, React Three Fiber, React Three XR, Spline |
| **AI Integration** | Google Generative AI API, Genkit |
| **Desktop Wrapper** | Electron, Electron Builder |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Lucide React |
| **Data Viz** | Mermaid.js |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm or pnpm
- Valid Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rohanranga/3d-repo-analyser.git
   cd 3d-repo-analyser
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file in the root directory and add your required environment variables (e.g., AI API keys):
   ```env
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```

### Running the Project

#### 🌐 Web Development Server
Run the standard Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 🖥️ Desktop Application (Electron)
To build and run the standalone Windows desktop executable:
```bash
npm run build:electron
```
The compiled `.exe` will be generated in the `dist-electron` directory.

---

## 🏗️ Project Architecture

CodeSonar combines a robust Next.js frontend with specialized 3D canvas rendering via WebGL. The application logic is segmented into:
- `src/components/explorer3d/`: Spatial components, nodes, and WebXR interactions.
- `src/lib/ai.ts`: AI prompt generation and GenKit integrations.
- `src/app/api/explain-node/`: Serverless routes managing LLM interactions.
- `electron/`: Main process configurations for the native desktop shell.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](https://github.com/Rohanranga/3d-repo-analyser/issues). 

## 📝 License

This project is licensed under the MIT License.
