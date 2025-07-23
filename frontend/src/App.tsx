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
import AdminDashboard from './pages/AdminDashboard';
import ConsultantDashboard from './pages/ConsultantDashboard';
import LearningCenter from './pages/LearningCenter';

// Components
import AuthProvider from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuth } from './contexts/AuthContext';

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

// Role-based route protection component
const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'consultant') {
      return <Navigate to="/consultant" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              
                {/* Protected routes with role-based access */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <Layout>
                      <Dashboard />
                    </Layout>
                      </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/farms"
                element={
                  <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <Layout>
                      <Farms />
                    </Layout>
                      </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/monitoring"
                element={
                  <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <Layout>
                      <Monitoring />
                    </Layout>
                      </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <Layout>
                      <Chat />
                    </Layout>
                      </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <Layout>
                      <Analytics />
                    </Layout>
                      </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/disease-detection"
                element={
                  <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <Layout>
                      <DiseaseDetection />
                    </Layout>
                      </RoleProtectedRoute>
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
                
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin']}>
                        <Layout>
                          <AdminDashboard />
                        </Layout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/consultant"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['consultant']}>
                        <Layout>
                          <ConsultantDashboard />
                        </Layout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/learning"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['farmer']}>
                        <Layout>
                          <LearningCenter />
                        </Layout>
                      </RoleProtectedRoute>
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
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;