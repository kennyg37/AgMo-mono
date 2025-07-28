import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  MessageSquare, 
  User, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Smile,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import api from '../services/api';

interface Message {
  id: string;
  content: string;
  sender: 'farmer' | 'consultant';
  timestamp: string;
  is_read: boolean;
  attachments?: string[];
  message_type: 'text' | 'image' | 'file';
}

interface Consultant {
  id: number;
  name: string;
  specialization: string;
  avatar?: string;
  is_online: boolean;
  rating: number;
  response_time: string;
}

interface Consultation {
  id: string;
  consultant_id: number;
  farmer_id: number;
  status: 'active' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  subject: string;
  messages: Message[];
}

const Consult: React.FC = () => {
  const { t } = useTranslation();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [consultationSubject, setConsultationSubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch consultations on component mount
  useEffect(() => {
    fetchConsultations();
    fetchConsultants();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [currentConsultation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

    const fetchConsultations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/consultations/test/');
      setConsultations(response.data);
      
      // Set the first consultation as current if none selected
      if (response.data.length > 0 && !currentConsultation) {
        setCurrentConsultation(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const response = await api.get('/api/consultations/consultants/');
      setConsultants(response.data);
    } catch (error) {
      console.error('Failed to fetch consultants:', error);
    }
  };

    const sendMessage = async () => {
    if (!newMessage.trim() || !currentConsultation) return;

    setIsSending(true);
    try {
      const response = await api.post(`/api/consultations/test/${currentConsultation.id}/messages`, {
        content: newMessage,
        message_type: 'text'
      });

      // Update the current consultation with the new message
      const updatedConsultation = {
        ...currentConsultation,
        messages: [...currentConsultation.messages, response.data]
      };
      setCurrentConsultation(updatedConsultation);

      // Update consultations list
      setConsultations(prev => 
        prev.map(consultation => 
          consultation.id === currentConsultation.id ? updatedConsultation : consultation
        )
      );

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

    const createNewConsultation = async () => {
    if (!consultationSubject.trim() || !selectedConsultant) return;

    setIsLoading(true);
    try {
      const response = await api.post('/api/consultations/test/', {
        consultant_id: selectedConsultant.id,
        subject: consultationSubject
      });

      const newConsultation = response.data;
      setConsultations(prev => [newConsultation, ...prev]);
      setCurrentConsultation(newConsultation);
      setShowNewConsultation(false);
      setConsultationSubject('');
      setSelectedConsultant(null);
    } catch (error) {
      console.error('Failed to create consultation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConsultationStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consult with Experts</h1>
            <p className="text-gray-600">Get advice from agricultural consultants</p>
          </div>
          <button
            onClick={() => setShowNewConsultation(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MessageSquare className="w-4 h-4" />
            <span>New Consultation</span>
          </button>
        </div>
      </div>

      <div className="flex overflow-hidden bg-gray-50 rounded-lg border border-gray-200" style={{ height: '600px' }}>
        {/* Sidebar - Consultations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Consultations</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : consultations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No consultations yet</p>
                <p className="text-sm">Start a new consultation to get expert advice</p>
              </div>
            ) : (
              <div className="space-y-1">
                {consultations.map((consultation) => {
                  const consultant = consultants.find(c => c.id === consultation.consultant_id);
                  const lastMessage = consultation.messages[consultation.messages.length - 1];
                  
                  return (
                    <button
                      key={consultation.id}
                      onClick={() => setCurrentConsultation(consultation)}
                      className={`w-full p-4 text-left hover:bg-gray-50 border-l-4 ${
                        currentConsultation?.id === consultation.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {consultation.subject}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getConsultationStatusColor(consultation.status)}`}>
                          {consultation.status}
                        </span>
                      </div>
                      
                      {consultant && (
                        <p className="text-sm text-gray-600 mb-1">
                          with {consultant.name}
                        </p>
                      )}
                      
                      {lastMessage && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate flex-1">
                            {lastMessage.content}
                          </p>
                          <span className="text-xs text-gray-400 ml-2">
                            {formatTimestamp(lastMessage.timestamp)}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentConsultation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{currentConsultation.subject}</h3>
                      <p className="text-sm text-gray-600">
                        with {consultants.find(c => c.id === currentConsultation.consultant_id)?.name || 'Consultant'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getConsultationStatusColor(currentConsultation.status)}`}>
                      {currentConsultation.status}
                    </span>
                    <button
                      onClick={fetchConsultations}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {currentConsultation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'farmer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'farmer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        message.sender === 'farmer' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatTimestamp(message.timestamp)}</span>
                        {message.sender === 'farmer' && (
                          <span className="flex items-center space-x-1">
                            {message.is_read ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      disabled={isSending}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No consultation selected</h3>
                <p className="text-gray-600 mb-4">Choose a consultation from the sidebar or start a new one</p>
                <button
                  onClick={() => setShowNewConsultation(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start New Consultation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Consultation Modal */}
      {showNewConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Start New Consultation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={consultationSubject}
                  onChange={(e) => setConsultationSubject(e.target.value)}
                  placeholder="What would you like to discuss?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Consultant
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {consultants.map((consultant) => (
                    <button
                      key={consultant.id}
                      onClick={() => setSelectedConsultant(consultant)}
                      className={`w-full p-3 text-left border rounded-lg ${
                        selectedConsultant?.id === consultant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{consultant.name}</h4>
                          <p className="text-sm text-gray-600">{consultant.specialization}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${
                            consultant.is_online ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-xs text-gray-500">
                            {consultant.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNewConsultation(false);
                  setConsultationSubject('');
                  setSelectedConsultant(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createNewConsultation}
                disabled={!consultationSubject.trim() || !selectedConsultant || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Start Consultation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consult; 