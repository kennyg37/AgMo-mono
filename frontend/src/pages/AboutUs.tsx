import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Users, Brain, Globe, Award, Heart, Zap, Shield } from 'lucide-react';

const AboutUs: React.FC = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Innovation",
      description: "We continuously push the boundaries of agricultural technology to provide cutting-edge solutions for farmers."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Sustainability",
      description: "We promote sustainable farming practices that protect the environment while improving crop yields."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community",
      description: "We believe in empowering farming communities through knowledge sharing and collaborative solutions."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Trust",
      description: "We maintain the highest standards of data security and privacy to earn and keep your trust."
    }
  ];

  const team = [
    {
      name: "Dr. Sarah Uwimana",
      role: "Chief Executive Officer",
      bio: "Agricultural scientist with 15+ years experience in sustainable farming and technology innovation.",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Emmanuel Ndayisaba",
      role: "Chief Technology Officer",
      bio: "AI/ML expert specializing in computer vision and agricultural technology development.",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Marie Claire Uwamahoro",
      role: "Head of Agricultural Research",
      bio: "Plant pathologist with expertise in crop disease detection and prevention strategies.",
      image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Jean Pierre Habimana",
      role: "Lead Software Engineer",
      bio: "Full-stack developer focused on building scalable agricultural technology platforms.",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    }
  ];

  const milestones = [
    {
      year: "2023",
      title: "Platform Launch",
      description: "Successfully launched AGMO Farm with initial disease detection capabilities for maize crops."
    },
    {
      year: "2024",
      title: "AI Enhancement",
      description: "Expanded AI models to support multiple crop types and improved detection accuracy to 95%."
    },
    {
      year: "2024",
      title: "Community Growth",
      description: "Reached 10,000+ farmers across Rwanda with our monitoring and advisory services."
    },
    {
      year: "2025",
      title: "Regional Expansion",
      description: "Expanding services to neighboring countries and developing advanced predictive analytics."
    }
  ];

  const technologies = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Artificial Intelligence",
      description: "Advanced CNN models for disease detection and computer vision for plant health analysis."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "IoT sensors and weather integration for continuous field monitoring and alerts."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Cloud Computing",
      description: "Scalable cloud infrastructure ensuring reliable service delivery across Rwanda."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Data Analytics",
      description: "Advanced analytics providing insights for better farming decisions and yield optimization."
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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              About AGMO Farm
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're revolutionizing agriculture in Rwanda through AI-powered technology, 
              helping farmers increase yields, reduce losses, and build sustainable farming practices.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-lg text-gray-700 mb-4">
                  At AGMO Farm, we believe that technology has the power to transform 
                  agriculture and improve the lives of farmers across Rwanda. Our mission 
                  is to provide accessible, intelligent solutions that help farmers make 
                  better decisions and achieve sustainable success.
                </p>
                <p className="text-lg text-gray-700 mb-4">
                  We combine cutting-edge artificial intelligence with deep agricultural 
                  knowledge to create a platform that not only detects plant diseases 
                  but also provides actionable insights for crop management, weather 
                  monitoring, and yield optimization.
                </p>
                <p className="text-lg text-gray-700">
                  Our commitment extends beyond technology – we're building a community 
                  of empowered farmers who can share knowledge, learn from each other, 
                  and collectively advance agricultural practices in Rwanda.
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Vision for the Future
                </h3>
                <p className="text-gray-700">
                  To become the leading agricultural technology platform in East Africa, 
                  empowering millions of farmers with intelligent tools and insights that 
                  drive sustainable agricultural development and food security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape our approach to 
              agricultural technology and community development.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-700">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Technology
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We leverage cutting-edge technology to deliver intelligent agricultural 
              solutions that are both powerful and accessible.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technologies.map((tech, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  {tech.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tech.title}
                </h3>
                <p className="text-gray-700">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet the passionate individuals behind AGMO Farm, dedicated to 
              revolutionizing agriculture in Rwanda.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-green-600 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-gray-700 text-sm">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Key milestones in our mission to transform agriculture through technology.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {milestone.year}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {milestone.title}
                </h3>
                <p className="text-gray-700">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Join the Agricultural Revolution
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Ready to transform your farming practices with AI-powered insights? 
            Start your journey with AGMO Farm today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 