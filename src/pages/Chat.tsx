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
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  // Mock clinic data
  const clinic = useMemo(() => ({
    name: "Clínica Veterinária Pet Care",
    avatar: "/placeholder.svg",
    online: true
  }), []);

  const mockResponses = useMemo(() => [
    'Obrigado pelas informações. Nosso veterinário está analisando o caso.',
    'Entendi. Isso pode ser um sinal de que precisamos examinar mais de perto.',
    'Vou encaminhar seu caso para nosso especialista.',
    'Podemos agendar uma consulta para hoje ainda. Que horário seria melhor para você?'
  ], []);

  // Initialize chat with system message
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: crypto.randomUUID(),
        text: 'Olá! Recebemos seu chamado e em breve um de nossos veterinários entrará em contato. Enquanto isso, pode nos contar mais detalhes sobre o caso?',
        sender: 'clinic',
        timestamp: new Date(),
        type: 'system'
      }
    ];
    setMessages(initialMessages);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateClinicResponse = useCallback(() => {
    const responses = [
      'Obrigado pelas informações. Nosso veterinário está analisando o caso.',
      'Entendi. Isso pode ser um sinal de que precisamos examinar mais de perto.',
      'Vou encaminhar seu caso para nosso especialista.',
      'Podemos agendar uma consulta para hoje ainda. Que horário seria melhor para você?'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const clinicMessage: Message = {
      id: createMessageId(),
      text: randomResponse,
      sender: 'clinic',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, clinicMessage]);
  }, []);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage: Message = {
      id: createMessageId(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate clinic response (mock)
    setTimeout(simulateClinicResponse, 1000 + Math.random() * 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={clinic.avatar} alt={clinic.name} />
              <AvatarFallback>PC</AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="font-semibold text-foreground">{clinic.name}</h2>
              <p className="text-sm text-muted-foreground">
                {clinic.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.type === 'system'
                    ? 'bg-muted text-muted-foreground border border-border/40'
                    : 'bg-card border border-border/40'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'user' 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground'
                }`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border/40 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-full border-border/50"
            />
            <Button 
              type="submit" 
              size="icon"
              className="rounded-full"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;