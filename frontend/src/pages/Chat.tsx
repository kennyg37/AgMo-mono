import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Clock, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  Settings,
  Download,
  Share2,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { chatAPI } from '../services/api';

interface Message {
  id: number;
  user_id: number;
  session_id: string;
  role: string;
  content: string;
  message_type: string;
  model_used?: string;
  tokens_used?: number;
  response_time?: number;
  intent?: string;
  confidence?: number;
  created_at: string;
}

interface ChatSession {
  session_id: string;
  messages: Message[];
  created_at: string;
}

const Chat: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat sessions
  const { data: sessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatAPI.getSessions(),
  });

  // Fetch current session messages
  const { data: sessionMessages } = useQuery({
    queryKey: ['chat-session', currentSession],
    queryFn: () => currentSession ? chatAPI.getSession(currentSession) : null,
    enabled: !!currentSession,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => chatAPI.sendMessage(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-session', currentSession] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      setMessage('');
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    },
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: ({ messageId, rating, comment }: { messageId: number; rating: number; comment?: string }) =>
      chatAPI.provideFeedback(messageId, rating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-session', currentSession] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSession) return;

    setIsTyping(true);
    
    const messageData = {
      session_id: currentSession,
      content: message,
      message_type: 'user_query',
      context: {
        farm_id: null, // Can be set based on selected farm
        field_id: null,
        crop_type: null,
      }
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = (messageId: number, rating: number) => {
    feedbackMutation.mutate({ messageId, rating });
  };

  const createNewSession = () => {
    const sessionId = `session_${Date.now()}`;
    setCurrentSession(sessionId);
    // In a real app, you'd create the session on the backend
  };

  const getMessageIcon = (role: string) => {
    return role === 'user' ? (
      <User className="w-6 h-6 text-blue-600" />
    ) : (
      <Bot className="w-6 h-6 text-green-600" />
    );
  };

  const getMessageStyle = (role: string) => {
    return role === 'user' 
      ? 'bg-blue-600 text-white ml-auto' 
      : 'bg-gray-100 text-gray-900';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const messages = sessionMessages?.data?.messages || [];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>
            <button
              onClick={createNewSession}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions?.data?.map((session: ChatSession) => (
            <div
              key={session.session_id}
              onClick={() => setCurrentSession(session.session_id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentSession === session.session_id ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {`Session ${session.session_id?.slice(-6) || 'Unknown'}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {session.messages?.length > 0 ? session.messages[session.messages.length - 1].content : 'No messages'}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {session.messages?.length || 0} messages
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Farming Assistant</h3>
                <p className="text-sm text-gray-600">Get expert advice on crop management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a New Conversation</h3>
                <p className="text-gray-600 mb-4">
                  Ask me anything about farming, crop management, or get personalized advice.
                </p>
                <button
                  onClick={createNewSession}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg: Message) => (
                <div key={msg.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {getMessageIcon(msg.role)}
                  </div>
                  <div className="flex-1">
                    <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyle(msg.role)}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(msg.created_at)}
                      </span>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleFeedback(msg.id, 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, -1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <Bot className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-2 rounded-lg bg-gray-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        {currentSession && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about crop management, pest control, weather advice..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isTyping}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-3 flex items-center space-x-4">
              <span className="text-xs text-gray-500">Quick actions:</span>
              {[
                'Crop health check',
                'Weather forecast',
                'Pest identification',
                'Irrigation advice'
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(action)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 