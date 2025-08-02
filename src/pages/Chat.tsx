import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Phone, MoreVertical, ShieldAlert, Ban } from 'lucide-react';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const { messages, sendMessage, addMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);
  
  // Mock clinic data memoized
  const clinicData = useMemo(() => ({
    name: "Clínica Veterinária Pet Care",
    avatar: "/placeholder.svg",
    online: true
  }), []);

  // Initialize chat with system message
  useEffect(() => {
    addMessage({
      text: INITIAL_MESSAGE,
      sender: 'clinic',
      type: 'system'
    });
  }, [addMessage]);

  // Optimized scroll handler
  const handleScroll = useCallback(() => {
    if (messageListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
      isScrolledToBottom.current = scrollHeight - scrollTop <= clientHeight + 100;
    }
  }, []);

  // Effect for scroll handling
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.addEventListener('scroll', handleScroll);
      return () => messageList.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Auto scroll to bottom with optimization
  useEffect(() => {
    if (isScrolledToBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Optimized message handler
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessage(message);
    setMessage('');
    isScrolledToBottom.current = true;
  }, [message, sendMessage, setMessage]);

  return (
    <div className="apple-bg flex flex-col h-screen">
      {/* Header */}
      <div className="apple-card" style={{boxShadow:'0 4px 24px #007aff11', marginBottom:'2rem', maxWidth:'600px', width:'100%'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-12 h-12">
              <AvatarImage src={clinicData.avatar} alt={clinicData.name} />
              <AvatarFallback>PC</AvatarFallback>
            </Avatar>
            <div>
              <h2 style={{fontWeight:600, fontSize:'1.3rem', letterSpacing:'-1px'}}>{clinicData.name}</h2>
              <p style={{fontSize:'0.95rem', color: clinicData.online ? '#388e3c' : '#d32f2f'}}>
                {clinicData.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-2">
                <button
                  className="flex items-center w-full px-2 py-2 rounded hover:bg-muted text-sm gap-2"
                  onClick={() => {
                    toast({
                      title: 'Denúncia enviada',
                      description: 'A clínica foi denunciada. Nossa equipe irá analisar o caso.',
                      variant: 'default',
                    });
                  }}
                >
                  <ShieldAlert className="w-4 h-4 text-yellow-500" /> Denunciar
                </button>
                <button
                  className="flex items-center w-full px-2 py-2 rounded hover:bg-muted text-sm gap-2 text-red-600"
                  onClick={() => {
                    toast({
                      title: 'Clínica bloqueada',
                      description: 'Você bloqueou esta clínica. Não receberá mais mensagens deste chat.',
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={messageListRef} style={{maxWidth:'600px', width:'100%', margin:'0 auto'}}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`apple-card ${msg.sender === 'user' ? 'bg-[#007aff] text-white' : msg.type === 'system' ? 'bg-[#f8fafc] text-[#555] border border-[#e5e7eb]' : 'bg-white border border-[#e5e7eb]'} max-w-xs lg:max-w-md px-4 py-3 rounded-2xl`}
                style={{boxShadow:'0 2px 12px #007aff11', marginBottom:'0'}}
              >
                <p className="text-sm" style={{fontWeight:500}}>{msg.text}</p>
                <p className="text-xs mt-1" style={{color: msg.sender === 'user' ? '#e0eaff' : '#888'}}>
                  {formatDateToLocale(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div style={{maxWidth:'600px', width:'100%', margin:'0 auto', marginBottom:'2rem'}}>
        <form onSubmit={handleSendMessage} className="flex gap-2" style={{marginTop:'2rem'}}>
          <div style={{flex:1, background:'#fff', borderRadius:'24px', boxShadow:'0 2px 12px #007aff11', display:'flex', alignItems:'center', padding:'0.5rem 1rem'}}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="apple-input flex-1"
              style={{borderRadius:'18px', background:'transparent', border:'none', boxShadow:'none', fontSize:'1.1rem', outline:'none'}}
            />
          </div>
          <button 
            type="submit" 
            className="apple-btn rounded-full"
            disabled={!message.trim()}
            style={{padding:'0 1.2rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px #007aff22'}}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;