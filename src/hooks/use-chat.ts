import { useState, useCallback, useRef } from 'react';
import { CLINIC_RESPONSES } from '@/constants/messages';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'clinic';
  timestamp: Date;
  type?: 'text' | 'system';
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const simulateClinicResponse = useCallback(() => {
    const randomResponse = CLINIC_RESPONSES[Math.floor(Math.random() * CLINIC_RESPONSES.length)];
    
    return addMessage({
      text: randomResponse,
      sender: 'clinic'
    });
  }, [addMessage]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    // Add user message
    addMessage({
      text: text.trim(),
      sender: 'user'
    });

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for clinic response
    timeoutRef.current = setTimeout(() => {
      simulateClinicResponse();
    }, 1000 + Math.random() * 2000);
  }, [addMessage, simulateClinicResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    messages,
    sendMessage,
    addMessage,
    clearMessages
  };
};
