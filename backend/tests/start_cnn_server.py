#!/usr/bin/env python3
"""
Startup script for the Maize Disease Detection CNN Server

This script starts the WebSocket server that handles image classification
requests from the simulation.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from backend.tests.cnn_server import main

if __name__ == "__main__":
    print("🌽 Starting Maize Disease Detection CNN Server...")
    print("📡 WebSocket server will be available on ws://localhost:8001")
    print("🔄 Press Ctrl+C to stop the server")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1) 