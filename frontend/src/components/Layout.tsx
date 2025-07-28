import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { 
  LayoutDashboard, 
  Sprout, 
  Activity, 
  MessageSquare, 
  BarChart3, 
  User, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Brain,
  BookOpen,
  Users,
  Shield,
  Settings,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavigation = () => {
    const baseNavigation = [
      { 
        name: t('navigation.profile'), 
        href: '/profile', 
        icon: User,
        description: t('common.accountSettings')
      },
    ];

    // Role-specific navigation
    if (user?.role === 'admin') {
      return [
        { 
          name: t('navigation.dashboard'), 
          href: '/dashboard', 
          icon: LayoutDashboard,
          description: t('common.overviewAndAnalytics')
        },
        { 
          name: t('navigation.adminPanel'), 
          href: '/admin', 
          icon: Shield,
          description: t('common.userManagement')
        },
        ...baseNavigation,
      ];
    } else if (user?.role === 'consultant') {
      return [
        { 
          name: t('navigation.consultantDashboard'), 
          href: '/consultant', 
          icon: Users,
          description: t('common.courseManagement')
        },
        ...baseNavigation,
      ];
    } else {
      // Farmer navigation - reorganized by importance
      return [
        { 
          name: t('navigation.dashboard'), 
          href: '/dashboard', 
          icon: LayoutDashboard,
          description: t('common.overviewAndAnalytics')
        },
        { 
          name: t('navigation.monitoring'), 
          href: '/monitoring', 
          icon: Activity,
          description: t('common.realTimeMonitoring')
        },
        { 
          name: t('navigation.chat'), 
          href: '/chat', 
          icon: MessageSquare,
          description: t('common.aiAssistant')
        },
        { 
          name: t('navigation.consult'), 
          href: '/consult', 
          icon: Users,
          description: t('common.expertConsultation')
        },
        { 
          name: t('navigation.diseaseDetection'), 
          href: '/disease-detection', 
          icon: Brain,
          description: t('common.aiDiseaseDetection')
        },
        { 
          name: t('navigation.farms'), 
          href: '/farms', 
          icon: Sprout,
          description: t('common.manageYourFarms')
        },

        { 
          name: t('navigation.learningCenter'), 
          href: '/learning', 
          icon: BookOpen,
          description: t('common.educationalMaterials')
        },
        ...baseNavigation,
      ];
    }
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setUserMenuOpen(false);
  };

  const handleSettingsClick = () => {
    // Navigate to settings page or show settings modal
    setUserMenuOpen(false);
  };

  const handleHelpClick = () => {
    // Navigate to help page or show help modal
    setUserMenuOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                AGMO Farm
              </h1>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <Icon className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} ${
                  isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'
                } transition-colors`} />
                
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-3">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </span>
            </div>
            
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {user?.role || 'farmer'}
                </p>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>

              {/* Search */}
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('actions.search')}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors w-64"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <LanguageSelector />

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User dropdown menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role || 'farmer'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.full_name || user?.username}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-400 capitalize mt-1">
                        {user?.role || 'farmer'}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3 text-gray-400" />
                        {t('navigation.profile')}
                      </button>
                      
                      <button
                        onClick={handleSettingsClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3 text-gray-400" />
                        {t('common.settings')}
                      </button>
                      
                      <button
                        onClick={handleHelpClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 mr-3 text-gray-400" />
                        {t('common.helpAndSupport')}
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3 text-red-400" />
                        {t('common.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">A</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">AGMO Farm</span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <Link to="/about" className="hover:text-gray-900">About</Link>
                  <Link to="/contact" className="hover:text-gray-900">Contact</Link>
                  <Link to="/privacy" className="hover:text-gray-900">Privacy</Link>
                  <Link to="/terms" className="hover:text-gray-900">Terms</Link>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                &copy; 2025 AGMO Farm
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Click outside to close dropdown */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;