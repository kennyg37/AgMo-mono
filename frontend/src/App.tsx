import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import Monitoring from './pages/Monitoring';
import Chat from './pages/Chat';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import DiseaseDetection from './pages/DiseaseDetection';

// Components
import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Styles
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/farms"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Farms />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/monitoring"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Monitoring />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Chat />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/disease-detection"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DiseaseDetection />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;