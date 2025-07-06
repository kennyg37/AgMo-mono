import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { SimulationEngine } from './simulation/SimulationEngine.js';
import { setupSocketHandlers } from './socket/socketHandlers.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize simulation engine
const simulationEngine = new SimulationEngine();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    simulation: {
      isRunning: simulationEngine.isRunning,
      step: simulationEngine.step,
    }
  });
});

// API endpoints
app.get('/api/simulation/state', (req, res) => {
  res.json(simulationEngine.getState());
});

app.post('/api/simulation/reset', (req, res) => {
  simulationEngine.reset();
  res.json({ success: true });
});

// Setup WebSocket handlers
setupSocketHandlers(io, simulationEngine);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Simulation server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  
  // Initialize simulation
  simulationEngine.initialize().then(() => {
    console.log('✅ Simulation engine initialized');
  }).catch((error) => {
    console.error('❌ Failed to initialize simulation engine:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down simulation server...');
  simulationEngine.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});