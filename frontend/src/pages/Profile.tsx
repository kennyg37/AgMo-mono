import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Settings,
  Bell,
  Shield,
  Key,
  Eye,
  EyeOff,
  Camera,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Trash2,
  LogOut,
  Activity,
  BarChart3,
  MessageSquare,
  Globe,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  BellOff,
  BellRing,
  Clock,
  Star,
  Award,
  Target,
  TrendingUp,
  Users as UsersIcon,
  Building,
  Crop,
  Droplets,
  Thermometer,
  Wind
} from 'lucide-react';
import { authAPI } from '../services/api';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  company: string;
  role: string;
  created_at: string;
  last_login: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    email_alerts: boolean;
    sms_alerts: boolean;
    language: string;
    timezone: string;
  };
  stats: {
    total_farms: number;
    total_acres: number;
    active_fields: number;
    health_score: number;
  };
}

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const queryClient = useQueryClient();

  const getMockProfile = (): UserProfile => ({
    id: 1,
    email: 'farmer@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1 (555) 123-4567',
    location: 'Iowa, USA',
    company: 'Doe Family Farms',
    role: 'Farm Manager',
    created_at: '2023-01-15T10:00:00Z',
    last_login: new Date().toISOString(),
    preferences: {
      theme: 'light',
      notifications: true,
      email_alerts: true,
      sms_alerts: false,
      language: 'en',
      timezone: 'America/Chicago',
    },
    stats: {
      total_farms: 3,
      total_acres: 1250,
      active_fields: 12,
      health_score: 87,
    },
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile(),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => authAPI.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    },
  });

  const user = profile?.data || getMockProfile();

  const handleSaveProfile = (formData: FormData) => {
    const profileData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      company: formData.get('company'),
    };
    updateProfileMutation.mutate(profileData);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Settings },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-gray-600">{user.role}</p>
                  <p className="text-sm text-gray-500">Member since {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile(new FormData(e.currentTarget));
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        name="first_name"
                        type="text"
                        defaultValue={user.first_name}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        name="last_name"
                        type="text"
                        defaultValue={user.last_name}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        name="phone"
                        type="tel"
                        defaultValue={user.phone}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        name="location"
                        type="text"
                        defaultValue={user.location}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        name="company"
                        type="text"
                        defaultValue={user.company}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{user.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Company</p>
                        <p className="text-sm text-gray-600">{user.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Login</p>
                        <p className="text-sm text-gray-600">
                          {new Date(user.last_login).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Appearance</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Display</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Show animations</p>
                        <p className="text-xs text-gray-500">Enable smooth transitions</p>
                      </div>
                      <button className="w-12 h-6 bg-green-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Compact mode</p>
                        <p className="text-xs text-gray-500">Reduce spacing</p>
                      </div>
                      <button className="w-12 h-6 bg-gray-200 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sound effects</p>
                        <p className="text-xs text-gray-500">Play notification sounds</p>
                      </div>
                      <button className="w-12 h-6 bg-green-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Password</h4>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">SMS Authentication</p>
                    <p className="text-xs text-gray-500">Receive codes via SMS</p>
                  </div>
                  <button className="w-12 h-6 bg-gray-200 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Windows Desktop</p>
                        <p className="text-xs text-gray-500">Chrome • Last active 2 hours ago</p>
                      </div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Revoke
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">iPhone 12</p>
                        <p className="text-xs text-gray-500">Safari • Last active 1 day ago</p>
                      </div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">System alerts</p>
                        <p className="text-xs text-gray-500">Important system updates</p>
                      </div>
                      <button className="w-12 h-6 bg-green-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Crop health alerts</p>
                        <p className="text-xs text-gray-500">Disease and pest warnings</p>
                      </div>
                      <button className="w-12 h-6 bg-green-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Weather alerts</p>
                        <p className="text-xs text-gray-500">Severe weather warnings</p>
                      </div>
                      <button className="w-12 h-6 bg-green-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mobile alerts</p>
                        <p className="text-xs text-gray-500">Push notifications on mobile</p>
                      </div>
                      <button className="w-12 h-6 bg-green-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">SMS alerts</p>
                        <p className="text-xs text-gray-500">Text message notifications</p>
                      </div>
                      <button className="w-12 h-6 bg-gray-200 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Desktop notifications</p>
                        <p className="text-xs text-gray-500">Browser notifications</p>
                      </div>
                      <button className="w-12 h-6 bg-green-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{user.stats.total_farms}</p>
                      <p className="text-sm text-gray-600">Total Farms</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Crop className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{user.stats.total_acres.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Acres</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{user.stats.active_fields}</p>
                      <p className="text-sm text-gray-600">Active Fields</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Target className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${getHealthColor(user.stats.health_score)}`}>
                        {user.stats.health_score}%
                      </p>
                      <p className="text-sm text-gray-600">Health Score</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Field A-3 irrigation completed</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New crop planted in Field B-1</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Weather alert: Rain expected</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle password change
              setShowPasswordChange(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 