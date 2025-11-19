import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Phone, MoreVertical, ShieldAlert, Ban, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/use-chat';
import { INITIAL_MESSAGE } from '@/constants/messages';
import { formatDateToLocale } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'clinic';
  timestamp: Date;
  type?: 'text' | 'system';
}

const Chat = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const { messages, sendMessage, addMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  
  const isEmergency = new URLSearchParams(location.search).get('emergency') === 'true';
  const maxChars = isEmergency && !firstMessageSent ? 120 : 1000;
  
  const clinicData = useMemo(() => ({
    name: "Clínica Veterinária Pet Care",
    avatar: "/placeholder.svg",
    online: true
  }), []);

  useEffect(() => {
    const chatId = ticketId || 'default';
    const savedMessages = localStorage.getItem(chatId);
    
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      parsed.forEach((msg: any) => {
        addMessage({
          text: msg.text,
          sender: msg.sender,
          type: msg.type || 'text'
        });
      });
    } else {
      const initialMsg = isEmergency 
        ? 'ATENDIMENTO EMERGENCIAL - Um atendente irá responder em instantes. Por favor, descreva a emergência.'
        : INITIAL_MESSAGE;
      
      addMessage({
        text: initialMsg,
        sender: 'clinic',
        type: 'system'
      });
    }
  }, [addMessage, isEmergency, ticketId]);

  const handleScroll = useCallback(() => {
    if (messageListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
      isScrolledToBottom.current = scrollHeight - scrollTop <= clientHeight + 100;
    }
  }, []);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.addEventListener('scroll', handleScroll);
      return () => messageList.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (isScrolledToBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    if (isEmergency && !firstMessageSent && message.length > 120) {
      toast({
        title: "Limite excedido",
        description: "A primeira mensagem de emergência deve ter no máximo 120 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    sendMessage(message);
    setMessage('');
    if (isEmergency && !firstMessageSent) {
      setFirstMessageSent(true);
    }
    isScrolledToBottom.current = true;
  }, [message, sendMessage, setMessage, isEmergency, firstMessageSent, toast]);

  return (
    <div className="min-h-screen flex flex-col" style={{background: isEmergency ? 'linear-gradient(to bottom, #fef2f2, #ffffff)' : '#f9fafb'}}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{background: isEmergency ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                <AvatarImage src={clinicData.avatar} alt={clinicData.name} />
                <AvatarFallback className="bg-white text-purple-600 font-bold">PC</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  {clinicData.name}
                  {isEmergency && <AlertCircle className="w-5 h-5" />}
                </h2>
                <p className="text-white/90 text-sm font-medium">
                  {isEmergency ? '🚨 EMERGÊNCIA - Atendimento prioritário' : clinicData.online ? '🟢 Online' : '⚫ Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Phone className="w-5 h-5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-2">
                  <button
                    className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-yellow-50 text-sm gap-2 text-yellow-700 transition-colors"
                    onClick={() => {
                      toast({
                        title: 'Denúncia enviada',
                        description: 'A clínica foi denunciada. Nossa equipe irá analisar o caso.',
                      });
                    }}
                  >
                    <ShieldAlert className="w-4 h-4" /> Denunciar
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-red-50 text-sm gap-2 text-red-600 transition-colors"
                    onClick={() => {
                      toast({
                        title: 'Clínica bloqueada',
                        description: 'Você bloqueou esta clínica.',
                        variant: 'destructive',
                      });
                    }}
                  >
                    <Ban className="w-4 h-4" /> Bloquear
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" ref={messageListRef}>
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                  msg.sender === 'user' 
                    ? isEmergency ? 'bg-red-500 text-white' : 'bg-purple-600 text-white'
                    : msg.type === 'system' 
                    ? isEmergency ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'user' ? 'text-white/80' : 'text-gray-500'
                }`}>
                  {formatDateToLocale(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 border-t bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {isEmergency && !firstMessageSent && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">⚠️ Primeira mensagem limitada a 120 caracteres</p>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isEmergency && !firstMessageSent ? "Descreva a emergência brevemente..." : "Digite sua mensagem..."}
                maxLength={maxChars}
                className="pr-16 h-12 text-base border-2 focus:border-purple-500 rounded-xl"
              />
              {isEmergency && !firstMessageSent && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                  message.length > 120 ? 'text-red-600' : message.length > 100 ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {message.length}/120
                </span>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={!message.trim()}
              className={`h-12 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all ${
                isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
