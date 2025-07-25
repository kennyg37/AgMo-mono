# Frontend - AgMo Farm Management System

React-based farm management interface with AI-powered monitoring and analytics.

## Environment Configuration

The application uses environment variables for configuration. Copy `env.example` to `.env` and adjust the values:

```bash
# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### Available Environment Variables

| Variable                | Description               | Default                 |
| ----------------------- | ------------------------- | ----------------------- |
| `VITE_API_URL`          | Backend API URL           | `http://localhost:8000` |
| `VITE_FRONTEND_URL`     | Frontend URL              | `http://localhost:3000` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false`                 |
| `VITE_ENABLE_DEBUG`     | Enable debug mode         | `true`                  |
| `VITE_WEATHER_API_KEY`  | Weather API key           | -                       |
| `VITE_MAP_API_KEY`      | Map API key               | -                       |
| `VITE_APP_VERSION`      | Application version       | `1.0.0`                 |

### Environment Files

- `.env` - Local development (gitignored)
- `.env.production` - Production environment
- `.env.staging` - Staging environment
- `env.example` - Example configuration

## Features

- **Dashboard**: Real-time farm overview with key metrics and weather forecast
- **Farm Management**: Comprehensive farm and field management interface
- **AI Monitoring**: Plant health monitoring with disease detection
- **Weather Integration**: 5-day weather forecast with agricultural insights
- **Analytics**: Data visualization and trend analysis
- **Chat Assistant**: AI-powered agricultural consulting
- **Learning Center**: Educational resources for farmers
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- React 18 + TypeScript
- TanStack Query for data fetching
- Zustand for state management
- React Router for navigation
- Tailwind CSS for styling
- Vite for development and building
- Vitest for unit testing
- Playwright for E2E testing

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
src/
├── components/         # React components
│   ├── Layout.tsx     # Main layout component
│   ├── SimulationViewer.tsx # 3D simulation viewer
│   └── ...            # Other UI components
├── pages/             # Page components
│   ├── Dashboard.tsx  # Main dashboard
│   ├── Farms.tsx      # Farm management
│   ├── Monitoring.tsx # Monitoring interface
│   └── ...            # Other pages
├── services/          # API services
│   └── api.ts         # API configuration
├── config/            # Configuration
│   └── environment.ts # Environment variables
├── utils/             # Utility functions
│   └── urls.ts        # URL utilities
├── contexts/          # React contexts
│   ├── AuthContext.tsx # Authentication context
│   └── LocationContext.tsx # Location context
├── store/             # State management
│   └── simulationStore.ts # Simulation state
└── App.tsx           # Main application component
```

## Configuration

### Environment Variables

The application uses environment variables for configuration. See the `env.example` file for all available options.

### API Configuration

The frontend communicates with the backend API. Configure the API URL using the `VITE_API_URL` environment variable.

### Build Configuration

The application uses Vite for building. Environment variables are embedded at build time, so changes require a rebuild.

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```
