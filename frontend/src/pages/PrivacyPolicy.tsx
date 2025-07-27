import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, Lock, Database, Users, Camera, MessageSquare, BarChart3 } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Personal Information",
          details: [
            "Full name, email address, username, and phone number",
            "Location data and farm details (size, crops, experience)",
            "Role information (farmer, consultant, admin)",
            "Profile information including bio and expertise proof"
          ]
        },
        {
          subtitle: "Location Data",
          details: [
            "GPS coordinates and farm location for accurate weather forecasting",
            "Field boundaries and coordinates for precise weather monitoring",
            "Location data used to provide region-specific agricultural recommendations",
            "Location information shared with weather service providers for accurate forecasts"
          ]
        },
        {
          subtitle: "Farm and Agricultural Data",
          details: [
            "Farm details including name, location, and total acres",
            "Field information with coordinates and soil type",
            "Crop data including type, planting dates, and growth stages",
            "Sensor data from IoT devices (soil moisture, temperature, etc.)",
            "Weather data including temperature, humidity, and precipitation"
          ]
        },
        {
          subtitle: "AI and Monitoring Data",
          details: [
            "Plant health images and analysis results",
            "Disease detection predictions and confidence scores",
            "Chat conversation history with AI assistant",
            "Analytics and decision logs",
            "Learning progress and course completion data"
          ]
        }
      ]
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Service Provision",
          details: [
            "Provide AI-powered disease detection and plant health monitoring",
            "Deliver personalized agricultural recommendations",
            "Enable real-time weather monitoring and alerts using your location data",
            "Support learning center and educational content",
            "Provide location-specific weather forecasts and agricultural advice"
          ]
        },
        {
          subtitle: "AI and Analytics",
          details: [
            "Train and improve our disease detection models",
            "Generate insights and analytics for better farming decisions",
            "Provide personalized chat assistance",
            "Analyze patterns for predictive agriculture"
          ]
        },
        {
          subtitle: "Communication",
          details: [
            "Send important alerts about plant health and weather",
            "Provide customer support and technical assistance",
            "Share educational content and farming tips",
            "Notify about system updates and new features"
          ]
        }
      ]
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Data Storage and Security",
      content: [
        {
          subtitle: "Data Storage",
          details: [
            "All data is stored securely on cloud servers",
            "Images and files are encrypted during transmission and storage",
            "Regular backups ensure data protection",
            "Data retention follows Rwandan data protection laws"
          ]
        },
        {
          subtitle: "Security Measures",
          details: [
            "End-to-end encryption for sensitive communications",
            "Multi-factor authentication for account security",
            "Regular security audits and vulnerability assessments",
            "Access controls based on user roles and permissions"
          ]
        }
      ]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Data Sharing and Disclosure",
      content: [
        {
          subtitle: "Limited Sharing",
          details: [
            "We do not sell your personal information to third parties",
            "Data may be shared with agricultural consultants (with your consent)",
            "Anonymous analytics data may be used for research purposes",
            "Legal disclosure only when required by Rwandan law"
          ]
        },
        {
          subtitle: "Service Providers",
          details: [
            "Weather data providers for accurate forecasting (location data shared for precise weather information)",
            "Cloud storage and hosting services",
            "AI model training and analytics platforms",
            "All providers are bound by strict data protection agreements"
          ]
        }
      ]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Your Rights and Choices",
      content: [
        {
          subtitle: "Access and Control",
          details: [
            "Access, update, or delete your personal information",
            "Download your data in a portable format",
            "Opt-out of non-essential communications",
            "Control sharing preferences for consultant access"
          ]
        },
        {
          subtitle: "Data Processing",
          details: [
            "Right to know how your data is being processed",
            "Right to object to certain types of processing",
            "Right to data portability",
            "Right to lodge complaints with relevant authorities"
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2 text-gray-900 hover:text-gray-700">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold">AGMO Farm</span>
              </Link>
            </div>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              This Privacy Policy describes how AGMO Farm collects, uses, and protects your information 
              in accordance with Rwandan data protection laws and regulations.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              <p>Effective date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Introduction
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 mb-4">
                AGMO Farm ("we," "our," or "us") is committed to protecting your privacy and ensuring 
                the security of your personal and agricultural data. This Privacy Policy explains how we 
                collect, use, store, and protect your information when you use our AI-powered agricultural 
                monitoring platform.
              </p>
              <p className="text-gray-700 mb-4">
                Our platform provides farmers with intelligent monitoring, disease detection, weather 
                tracking, and agricultural insights. We understand the sensitive nature of agricultural 
                data and are committed to maintaining the highest standards of data protection.
              </p>
              <p className="text-gray-700">
                This policy complies with the Rwandan Data Protection Law and other applicable regulations 
                governing the collection and processing of personal data in Rwanda.
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="border-t border-gray-200 pt-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-4">
                    {section.icon}
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        {item.subtitle}
                      </h3>
                      <ul className="space-y-2">
                        {item.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start">
                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Additional Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Contact Information
                </h3>
                <div className="text-gray-700 space-y-2">
                  <p>For privacy-related questions or concerns:</p>
                  <p>Email: privacy@agmofarm.com</p>
                  <p>Phone: +250 XXX XXX XXX</p>
                  <p>Address: Kigali, Rwanda</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Regulatory Compliance
                </h3>
                <div className="text-gray-700 space-y-2">
                  <p>This policy complies with:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Rwandan Data Protection Law</li>
                    <li>Rwanda Information and Communication Technology (ICT) Law</li>
                    <li>General Data Protection Regulation (GDPR) principles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Policy Updates
            </h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or applicable laws. We will notify you of any material changes by posting the updated 
              policy on our website and updating the "Last updated" date above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 