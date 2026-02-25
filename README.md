# Voxa 🎓

A real-time collaborative study platform where students can create/join study rooms, draw on a shared whiteboard, and communicate via voice.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Real-time:** Socket.IO
- **Voice:** WebRTC
- **AI:** Gemini API

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB

### Installation

1. **Clone the repository**
```bash
cd MajorProject
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd client
npm install
```

4. **Set up environment variables**
```bash
cd server
cp .env.example .env
# Edit .env and add your MongoDB URI and API keys
```

### Running the Application

1. **Start MongoDB** (if running locally)
```bash
mongod
```

2. **Start the server**
```bash
cd server
npm run dev
```

3. **Start the client** (in a new terminal)
```bash
cd client
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

## Features

- 🔐 User authentication (JWT)
- 🚪 Create/join study rooms
- 🎨 Real-time collaborative whiteboard
- 🎤 Voice communication
- 💬 Text chat
- 🤖 AI assistant
- 📸 Export whiteboard
- 🌙 Dark mode

## Project Structure

```
MajorProject/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── socket/
│   │   └── config/
│   └── package.json
└── README.md
```

## License

MIT
