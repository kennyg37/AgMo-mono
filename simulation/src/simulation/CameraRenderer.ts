import { createCanvas } from 'canvas';

export class CameraRenderer {
  private canvas: any;
  private ctx: any;
  private width = parseInt(process.env.RENDER_WIDTH || '224');
  private height = parseInt(process.env.RENDER_HEIGHT || '224');

  async initialize(): Promise<void> {
    console.log('📷 Initializing camera renderer...');
    
    try {
      this.canvas = createCanvas(this.width, this.height);
      this.ctx = this.canvas.getContext('2d');
      
      console.log(`✅ Camera renderer initialized (${this.width}x${this.height})`);
    } catch (error) {
      console.error('❌ Failed to initialize camera renderer:', error);
      throw error;
    }
  }

  render(position: [number, number, number], rotation: [number, number, number]): string {
    if (!this.ctx) return '';
    
    // Clear canvas
    this.ctx.fillStyle = '#87ceeb'; // Sky blue
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Simple ground rendering
    this.ctx.fillStyle = '#4a5d23'; // Ground green
    this.ctx.fillRect(0, this.height * 0.7, this.width, this.height * 0.3);
    
    // Simulate some plants as simple shapes
    this.ctx.fillStyle = '#2d5016'; // Dark green
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * this.width;
      const y = this.height * 0.7 - Math.random() * 20;
      const size = 5 + Math.random() * 10;
      this.ctx.fillRect(x, y, size, size);
    }
    
    // Add some noise to simulate realistic camera feed
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    this.ctx.putImageData(imageData, 0, 0);
    
    // Convert to base64
    return this.canvas.toBuffer('image/jpeg').toString('base64');
  }
}