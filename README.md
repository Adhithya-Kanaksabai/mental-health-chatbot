# Mental Wellness Chatbot

A conversational chatbot that helps users reflect on their mental state, journal their thoughts, and access wellness techniques. The frontend is built using React (Vite + TypeScript), while the backend is a TypeScript-based Express server that integrates with the OpenRouter API to generate AI responses.

---

## Features

- AI-powered chatbot for mental wellness support
- Guided journaling interface
- Informational pages with mental health techniques and resources
- Clean, modular React architecture with alias-based imports
- Express backend with OpenRouter integration
- Environment-variable-based API key management

---

## Tech Stack

### Frontend
- React + Vite + TypeScript
- CSS Modules or Tailwind CSS (based on your setup)
- Axios or Fetch API for communication

### Backend
- Node.js with Express (TypeScript)
- OpenAI SDK (configured for OpenRouter)
- dotenv for environment variable management
- CORS enabled

---

## Getting Started

### Prerequisites

- Node.js and npm
- OpenRouter API key (https://openrouter.ai)

---

### Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mental-wellness-chatbot.git
cd mental-wellness-chatbot
```
### Backend Setup
```bash
cd server
npm install
```
Create a .env file in the /server directory with the following:
```bash
OPENAI_API_KEY=your_openrouter_api_key_here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```
Start the backend server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
Open your browser and go to:
```bash
http://localhost:5173
```

## Project Structure

```text
mental-wellness-chatbot/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/            # Shared UI components
│   │   ├── pages/                 # Chat, Journal, Home, Techniques, Resources
│   │   ├── services/
│   │   │   └── aiServices.ts      # Handles OpenRouter API calls
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
├── server/
│   ├── index.ts                   # Express backend entry point
│   ├── .env                       # Your local environment file (not committed)
│   └── .env.example               # Example .env for contributors
├── README.md
