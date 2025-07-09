# AGMO Farm - Smart Farming Platform

A comprehensive fullstack farming application that helps farmers monitor crops, make data-driven decisions, and get AI-powered advice. The platform includes real-time simulation, crop monitoring, weather tracking, and intelligent decision support.

## 🌟 Features

### Core Features

- **User Authentication & Management** - Secure login/registration with JWT tokens
- **Farm Management** - Create and manage farms, fields, and crops
- **Real-time Monitoring** - Track plant health, weather conditions, and sensor data
- **AI-Powered Chatbot** - Get expert farming advice using OpenAI integration
- **3D Simulation** - Interactive drone simulation for crop monitoring
- **Analytics Dashboard** - Comprehensive insights and reporting
- **Decision Support** - AI-driven recommendations for farming decisions

### Technical Features

- **Fullstack Architecture** - FastAPI backend with React frontend
- **Real-time Communication** - WebSocket connections for live data
- **Database Management** - SQLAlchemy with SQLite/PostgreSQL support
- **AI Integration** - OpenAI GPT for intelligent farming advice
- **3D Visualization** - Three.js powered simulation environment
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS

## 🏗️ Architecture

```
AgMo-mono/
├── backend/                 # FastAPI Backend
│   ├── agmo/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core utilities
│   │   ├── models/         # Database models
│   │   ├── rl/             # Reinforcement Learning
│   │   ├── vision/         # Computer Vision
│   │   └── websocket/      # WebSocket handling
│   └── requirements.txt
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── store/          # State management
│   └── package.json
└── simulation/             # 3D Simulation Engine
    ├── src/
    │   ├── simulation/     # Simulation logic
    │   ├── socket/         # WebSocket handlers
    │   └── test/           # Tests
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key (optional)

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

5. **Run the backend:**
   ```bash
   python -m agmo.main
   ```

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Simulation Setup

1. **Navigate to simulation directory:**

   ```bash
   cd simulation
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start simulation server:**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Farm Management

- `GET /api/farms` - List user's farms
- `POST /api/farms` - Create new farm
- `GET /api/farms/{id}` - Get farm details
- `PUT /api/farms/{id}` - Update farm
- `DELETE /api/farms/{id}` - Delete farm

### Monitoring

- `GET /api/monitoring/plant-health/field/{id}` - Get plant health data
- `POST /api/monitoring/plant-health` - Create plant health record
- `GET /api/monitoring/weather/field/{id}` - Get weather data
- `GET /api/monitoring/sensors/field/{id}` - Get sensor data

### AI Chatbot

- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/sessions` - Get chat sessions
- `POST /api/chat/feedback/{id}` - Provide feedback

### ML/AI

- `POST /api/classify` - Classify plant health from image
- `GET /api/training/status` - Get training status
- `POST /api/training/start` - Start ML training

## 🎯 Key Features Explained

### 1. User Authentication

- JWT-based authentication
- User registration with farming profile
- Role-based access control

### 2. Farm Management

- Create and manage multiple farms
- Add fields with GPS coordinates
- Track crops with planting/harvest dates
- Monitor growth stages

### 3. Real-time Monitoring

- Plant health scoring (0-100)
- Disease and pest detection
- Weather data integration
- IoT sensor data collection
- Image-based analysis

### 4. AI Chatbot

- OpenAI GPT integration
- Context-aware farming advice
- Session management
- Feedback collection

### 5. 3D Simulation

- Interactive drone simulation
- Real-time crop monitoring
- Fullscreen mode support
- WebSocket communication

### 6. Analytics Dashboard

- Comprehensive farm overview
- Health score tracking
- Weather monitoring
- Activity timeline
- Quick action buttons

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Database
DATABASE_URL=sqlite:///./agmo_farm.db

# Authentication
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Simulation
SIMULATION_WS_URL=ws://localhost:3001

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Simulation Tests

```bash
cd simulation
npm test
```

## 📊 Database Schema

The application uses SQLAlchemy with the following main models:

- **User** - User accounts and profiles
- **Farm** - Farm properties and metadata
- **Field** - Individual fields within farms
- **Crop** - Crop plantings and growth data
- **PlantHealth** - Plant health monitoring records
- **WeatherData** - Weather monitoring data
- **SensorData** - IoT sensor readings
- **CropAnalytics** - Analytics and predictions
- **DecisionLog** - Decision tracking
- **ChatMessage** - AI chatbot conversations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the API documentation
- Review the test files for usage examples

## 🔮 Roadmap

- [ ] Advanced analytics with charts
- [ ] Mobile app development
- [ ] Integration with weather APIs
- [ ] Machine learning model training
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Integration with farming equipment
- [ ] Community features and sharing

---

**AGMO Farm** - Empowering farmers with intelligent technology for sustainable agriculture.
