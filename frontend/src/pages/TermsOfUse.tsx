import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Shield, AlertTriangle, Users, Brain, Camera, MessageSquare, BarChart3 } from 'lucide-react';

const TermsOfUse: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Acceptance of Terms",
      content: [
        {
          subtitle: "Agreement to Terms",
          details: [
            "By accessing or using AGMO Farm, you agree to be bound by these Terms of Use",
            "These terms apply to all users including farmers, consultants, and administrators",
            "You must be at least 18 years old to use our services",
            "Continued use of the platform constitutes acceptance of any updated terms"
          ]
        },
        {
          subtitle: "Service Description",
          details: [
            "AGMO Farm provides AI-powered agricultural monitoring and disease detection",
            "Services include real-time weather tracking, plant health analysis, and chat assistance",
            "Educational content and learning materials are provided for farming improvement",
            "Analytics and insights are generated based on your farm data"
          ]
        }
      ]
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "User Accounts and Responsibilities",
      content: [
        {
          subtitle: "Account Creation",
          details: [
            "You must provide accurate and complete information during registration",
            "You are responsible for maintaining the security of your account credentials",
            "You must notify us immediately of any unauthorized access to your account",
            "One account per person is allowed unless explicitly authorized"
          ]
        },
        {
          subtitle: "User Responsibilities",
          details: [
            "Provide accurate farm and crop information for better AI recommendations",
            "Ensure uploaded images are of appropriate quality for disease detection",
            "Provide accurate location data for weather monitoring and regional recommendations",
            "Use the platform in compliance with local agricultural regulations",
            "Respect the intellectual property rights of AGMO Farm and other users"
          ]
        },
        {
          subtitle: "Prohibited Activities",
          details: [
            "Sharing account credentials with unauthorized users",
            "Uploading malicious content or attempting to compromise system security",
            "Using the platform for illegal agricultural activities",
            "Attempting to reverse engineer or copy our AI models"
          ]
        }
      ]
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Services and Limitations",
      content: [
        {
          subtitle: "Disease Detection",
          details: [
            "Our AI models provide predictions based on uploaded plant images",
            "Detection accuracy depends on image quality and lighting conditions",
            "AI predictions are for informational purposes and should not replace professional diagnosis",
            "We continuously improve our models but cannot guarantee 100% accuracy"
          ]
        },
        {
          subtitle: "Chat Assistant",
          details: [
            "The AI chat assistant provides agricultural advice and information",
            "Responses are generated based on training data and may not be comprehensive",
            "Chat history is stored to improve service quality and user experience",
            "Users should verify important decisions with qualified agricultural professionals"
          ]
        },
        {
          subtitle: "Analytics and Insights",
          details: [
            "Analytics are based on your farm data and general agricultural knowledge",
            "Predictions and recommendations are estimates and may vary from actual results",
            "Weather data is sourced from third-party providers based on your location and may have delays",
            "Historical data analysis helps improve future predictions",
            "Location-based weather forecasts provide region-specific agricultural insights"
          ]
        }
      ]
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Data and Content",
      content: [
        {
          subtitle: "User Data",
          details: [
            "You retain ownership of your farm data and uploaded content",
            "We process your data to provide services and improve our AI models",
            "You grant us license to use anonymized data for research and development",
            "Data is stored securely and handled according to our Privacy Policy"
          ]
        },
        {
          subtitle: "Content Guidelines",
          details: [
            "Uploaded images should be clear and relevant to agricultural monitoring",
            "Do not upload images containing personal information or inappropriate content",
            "Ensure you have rights to share any content uploaded to the platform",
            "We may remove content that violates these terms or applicable laws"
          ]
        }
      ]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Intellectual Property and Licensing",
      content: [
        {
          subtitle: "AGMO Farm Rights",
          details: [
            "The platform, AI models, and software are owned by AGMO Farm",
            "Our trademarks, logos, and brand elements are protected intellectual property",
            "Educational content and learning materials are provided under license",
            "You may not copy, modify, or distribute our proprietary technology"
          ]
        },
        {
          subtitle: "User License",
          details: [
            "We grant you a limited license to use our platform for agricultural purposes",
            "This license is non-exclusive, non-transferable, and revocable",
            "You may not sublicense or allow others to use your account",
            "The license terminates when you stop using our services"
          ]
        }
      ]
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: "Disclaimers and Limitations",
      content: [
        {
          subtitle: "Service Availability",
          details: [
            "We strive for high availability but cannot guarantee uninterrupted service",
            "Scheduled maintenance may temporarily affect platform access",
            "Service quality may vary based on internet connectivity and device capabilities",
            "We are not responsible for delays or failures beyond our control"
          ]
        },
        {
          subtitle: "Agricultural Advice",
          details: [
            "AI recommendations are for informational purposes only",
            "We are not liable for agricultural decisions made based on our platform",
            "Users should consult qualified professionals for critical farming decisions",
            "Weather predictions and crop recommendations are estimates only"
          ]
        },
        {
          subtitle: "Limitation of Liability",
          details: [
            "AGMO Farm is not liable for indirect, incidental, or consequential damages",
            "Our total liability is limited to the amount paid for our services",
            "We are not responsible for crop losses or agricultural failures",
            "Liability limitations apply to the maximum extent permitted by Rwandan law"
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
              Terms of Use
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These Terms of Use govern your use of AGMO Farm's AI-powered agricultural monitoring platform 
              and related services.
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
                Welcome to AGMO Farm. These Terms of Use ("Terms") constitute a legally binding agreement 
                between you and AGMO Farm ("we," "our," or "us") regarding your use of our agricultural 
                technology platform.
              </p>
              <p className="text-gray-700 mb-4">
                Our platform provides farmers with AI-powered tools for disease detection, weather monitoring, 
                crop management, and agricultural insights. By using our services, you agree to these terms 
                and our Privacy Policy.
              </p>
              <p className="text-gray-700">
                These terms are governed by Rwandan law and any disputes will be resolved in accordance 
                with Rwandan legal procedures.
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

          {/* Termination */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Termination
            </h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We may terminate or suspend your account and access to our services at any time, with or 
                without cause, with or without notice. You may terminate your account at any time by 
                contacting us or deleting your account through the platform.
              </p>
              <p>
                Upon termination, your right to use the platform will cease immediately. We may retain 
                certain information as required by law or for legitimate business purposes, as outlined 
                in our Privacy Policy.
              </p>
            </div>
          </div>

          {/* Governing Law */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Governing Law and Dispute Resolution
            </h2>
            <div className="text-gray-700 space-y-4">
              <p>
                These Terms are governed by and construed in accordance with the laws of Rwanda. Any 
                disputes arising from these Terms or your use of our services will be resolved through 
                negotiation, mediation, or legal proceedings in Rwanda.
              </p>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions 
                will continue to be valid and enforceable.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>For questions about these Terms of Use:</p>
              <p>Email: legal@agmofarm.com</p>
              <p>Phone: +250 XXX XXX XXX</p>
              <p>Address: Kigali, Rwanda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse; 