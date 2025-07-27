import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, MessageSquare, Clock, Send } from 'lucide-react';

const ContactUs: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }, 1000);
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Get help with technical issues and general inquiries",
      contact: "support@agmofarm.com",
      response: "We respond within 24 hours"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak directly with our agricultural experts",
      contact: "+250 XXX XXX XXX",
      response: "Available Monday-Friday, 8AM-6PM"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      description: "Get instant help through our in-app chat system",
      contact: "Available in the app",
      response: "Real-time support during business hours"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Office Location",
      description: "Visit our headquarters in Kigali",
      contact: "Kigali, Rwanda",
      response: "By appointment only"
    }
  ];

  const faqItems = [
    {
      question: "How accurate is the disease detection AI?",
      answer: "Our AI models have been trained on extensive datasets and typically achieve 85-95% accuracy. However, results depend on image quality and lighting conditions. We recommend consulting with agricultural professionals for critical decisions."
    },
    {
      question: "What types of crops does the system support?",
      answer: "We currently support major crops including maize, wheat, soybeans, rice, potatoes, tomatoes, and more. Our system is continuously learning and expanding to support additional crop types."
    },
    {
      question: "How do I get started with AGMO Farm?",
      answer: "Simply create an account on our platform, add your farm details, and start uploading images for disease detection. Our AI assistant will guide you through the setup process."
    },
    {
      question: "Is my farm data secure?",
      answer: "Yes, we take data security seriously. All data is encrypted, stored securely, and handled according to our Privacy Policy and Rwandan data protection laws."
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about AGMO Farm? We're here to help. Reach out to our team 
            for support, technical assistance, or general inquiries.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Methods */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              Get in Touch
            </h2>
            
            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-4">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {method.title}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {method.description}
                      </p>
                      <p className="text-green-600 font-medium">
                        {method.contact}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {method.response}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Office Hours */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Clock className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Office Hours
                </h3>
              </div>
              <div className="space-y-2 text-gray-700">
                <p><strong>Monday - Friday:</strong> 8:00 AM - 6:00 PM</p>
                <p><strong>Saturday:</strong> 9:00 AM - 2:00 PM</p>
                <p><strong>Sunday:</strong> Closed</p>
                <p className="text-sm text-gray-500 mt-2">
                  Emergency support available 24/7 for critical agricultural issues
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              Send us a Message
            </h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    Thank you for your message! We'll get back to you within 24 hours.
                  </p>
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    There was an error sending your message. Please try again.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="technical-support">Technical Support</option>
                    <option value="disease-detection">Disease Detection Help</option>
                    <option value="account-issues">Account Issues</option>
                    <option value="feature-request">Feature Request</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="Please describe your inquiry or issue in detail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {item.question}
                </h3>
                <p className="text-gray-700">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs; 