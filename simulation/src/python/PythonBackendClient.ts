import WebSocket from 'ws';

export interface Observation {
  image: string;
  position: [number, number, number];
  velocity: [number, number, number];
  plants: Array<{
    id: string;
    position: [number, number, number];
    health: string;
    confidence: number;
  }>;
}

export class PythonBackendClient {
  private ws?: WebSocket;
  private connected = false;
  private reconnectInterval = 5000;
  private reconnectTimer?: NodeJS.Timeout;

  async connect(): Promise<void> {
    const wsUrl = process.env.PYTHON_BACKEND_WS || 'ws://localhost:8000/ws';
    
    console.log(`🐍 Connecting to Python backend: ${wsUrl}`);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log('✅ Connected to Python backend');
        this.connected = true;
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = undefined;
        }
      });
      
      this.ws.on('close', () => {
        console.log('❌ Disconnected from Python backend');
        this.connected = false;
        this.scheduleReconnect();
      });
      
      this.ws.on('error', (error) => {
        console.error('🐍 Python backend WebSocket error:', error);
        this.connected = false;
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('🐍 Failed to parse message from Python backend:', error);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to Python backend:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    console.log(`🔄 Scheduling reconnect in ${this.reconnectInterval}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'action':
        // Handle RL agent action
        console.log('🎮 Received action from RL agent:', message.data);
        break;
      
      case 'plant_classification':
        // Handle CNN plant classification result
        console.log('🌱 Received plant classification:', message.data);
        break;
      
      default:
        console.log('🐍 Unknown message type:', message.type);
    }
  }

  sendObservation(observation: Observation): void {
    if (!this.connected || !this.ws) return;
    
    try {
      this.ws.send(JSON.stringify({
        type: 'observation',
        data: observation,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('🐍 Failed to send observation to Python backend:', error);
    }
  }

  sendReward(reward: number, done: boolean): void {
    if (!this.connected || !this.ws) return;
    
    try {
      this.ws.send(JSON.stringify({
        type: 'reward',
        data: { reward, done },
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('🐍 Failed to send reward to Python backend:', error);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    
    this.connected = false;
  }
}