# SmartCrowd AI Implementation Plan

Provide a production-ready Web Application called "SmartCrowd AI - Intelligent Event Experience System". The solution addresses crowd congestion, long waiting times, poor navigation, and lack of real-time coordination via an AI Crowd Assistant and live heatmap simulations.

## User Review Required
The following plan details the file structure and technologies to be used. Since the tech stack is restricted to lightweight tools (Vanilla HTML/CSS/JS with Node.js backend), I am proposing an Express-based Node.js backend. I will integrate the official `@google/genai` SDK for Gemini API as the AI chat assistant. You will need to provide a `GEMINI_API_KEY` in a `.env` file before running the server to enable the intelligent assistant.

## Proposed Changes

### Backend Components
We will use a minimal Express application to serve frontend files and simulate backend systems.

#### [NEW] server.js
A lightweight Express app that serves the static frontend files and exposes API routes. 
- `/api/crowd`: Returns the live crowd density simulation data.
- `/api/chat`: Uses the Gemini API to respond to user messages, injecting current crowd metrics to ensure context-aware responses.

#### [NEW] package.json
Contains dependencies (`express`, `dotenv`, `@google/genai`).

### Frontend Components
The interface will feature a dark-themed, glassmorphic layout prioritizing a premium feel.

#### [NEW] index.html
A dashboard layout containing the live crowd map (zones mapping), statistics sidebar, and a floating chat widget for the AI assistant. It will include an "Emergency Exit" button.

#### [NEW] style.css
Vanilla CSS using modern aesthetics, transitions, and conditional color-coding (Green, Yellow, Red) for simulated crowd data.

#### [NEW] script.js
Pure JS that consistently polls the `/api/crowd` endpoint and adjusts the UI accordingly. It will also manage the chat behavior, dispatching user inquiries to `/api/chat`.

### Documentation
#### [NEW] README.md
Generates a complete overview including problem statement, features, logic, and run instructions.

## Open Questions
- Do you have any specific zones in mind for the map besides Entry, Food Court, Seating, Restrooms, and Exits?
- Are you comfortable providing the Gemini API Key in the `.env` file?

## Verification Plan

### Automated Tests
- Server will run with `npm start` and start the JS simulation successfully.

### Manual Verification
- Testing the frontend in browser `http://localhost:3000`
- Clicking "Emergency Exit" and observing the routing
- Asking the Chat Assistant questions regarding "Where is Food?" or "Where to go?" and ensuring it uses live context data.
