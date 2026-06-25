import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Phone, MoreVertical, ShieldAlert, Ban, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  fetchMessages,
  sendMessage as sendSupabaseMessage,
  subscribeToMessages,
  clientConfirmAppointment,
  clientCancelAppointment,
  type ChatMessage,
} from '@/lib/tickets';
import { supabase } from '@/lib/supabase';

const INITIAL_MSG = 'Olá! Recebemos seu chamado e em breve responderemos. Caso precise de mais informações, é só enviar uma mensagem aqui.';
const INITIAL_EMERGENCY = 'ATENDIMENTO EMERGENCIAL — Um atendente irá responder em instantes. Por favor, descreva a emergência brevemente.';

const Chat = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const isEmergency = new URLSearchParams(location.search).get('emergency') === 'true';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [firstMsgSent, setFirstMsgSent] = useState(false);
  const [clinicName, setClinicName] = useState('Clínica');
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  /* price confirmation flow */
  const [clientConfirmation, setClientConfirmation] = useState<'pending' | 'confirmed' | 'cancelled' | null>(null);
  const [pendingPrice, setPendingPrice] = useState<number | null>(null);
  const [isClientUser, setIsClientUser] = useState(false);
  const [confirmingAppt, setConfirmingAppt] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  const maxChars = isEmergency && !firstMsgSent ? 120 : 1000;

  /* ── Load ticket + validate participation (anti-IDOR) ───────────── */
  useEffect(() => {
    if (!ticketId || !user) return;

    (supabase as any)
      .from('tickets')
      .select('user_id, clinic_id, client_confirmation, pending_price, clinics(clinic_name)')
      .eq('id', ticketId)
      .single()
      .then(({ data, error }: any) => {
        if (error || !data) {
          setAccessDenied(true);
          return;
        }

        if (data.user_id !== user.id && data.clinic_id !== user.id) {
          setAccessDenied(true);
          return;
        }

        setClinicName(data.clinics?.clinic_name ?? 'Clínica');
        setClinicId(data.clinic_id);
        setIsClientUser(data.user_id === user.id);
        setClientConfirmation(data.client_confirmation ?? null);
        setPendingPrice(data.pending_price ?? null);
      });
  }, [ticketId, user]);

  /* ── Load history (only after access verified) ───────────────────── */
  useEffect(() => {
    if (!ticketId || !clinicId || accessDenied) return;
    fetchMessages(ticketId).then(msgs => {
      if (msgs.length === 0) {
        const text = isEmergency ? INITIAL_EMERGENCY : INITIAL_MSG;
        sendSupabaseMessage(ticketId, '', 'system', text).then(msg => setMessages([msg]));
      } else {
        setMessages(msgs);
        setFirstMsgSent(msgs.some(m => m.sender_type === 'client'));
      }
    }).catch(() => {
      setAccessDenied(true);
    });
  }, [ticketId, isEmergency, clinicId, accessDenied]);

  /* ── Realtime subscription (only after access verified) ───────────── */
  useEffect(() => {
    if (!ticketId || !clinicId || accessDenied) return;
    const channel = subscribeToMessages(ticketId, msg => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });
    return () => { (supabase as any).removeChannel(channel); };
  }, [ticketId, clinicId, accessDenied]);

  /* ── Scroll to bottom ───────────────────────────────────────────── */
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    atBottom.current = scrollHeight - scrollTop <= clientHeight + 80;
  }, []);

  useEffect(() => {
    if (atBottom.current) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send ───────────────────────────────────────────────────────── */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !user) return;

    const trimmed = input.trim();
    if (!trimmed) {
      toast({ title: 'Mensagem vazia', description: 'Digite algo antes de enviar.', variant: 'destructive' });
      return;
    }

    if (isEmergency && !firstMsgSent && trimmed.length > 120) {
      toast({ title: 'Limite excedido', description: 'Primeira mensagem: máx. 120 caracteres.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const senderType = user.userType === 'clinic' ? 'clinic' : 'client';
      await sendSupabaseMessage(ticketId, user.id, senderType, trimmed);
      setInput('');
      if (!firstMsgSent) setFirstMsgSent(true);
      atBottom.current = true;
    } catch {
      toast({ title: 'Erro', description: 'Mensagem não enviada.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!ticketId) return;
    setConfirmingAppt(true);
    try {
      await clientConfirmAppointment(ticketId);
      setClientConfirmation('confirmed');
      toast({ title: 'Consulta confirmada!', description: 'Seu agendamento foi confirmado.' });
    } catch {
      toast({ title: 'Erro ao confirmar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setConfirmingAppt(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!ticketId) return;
    setConfirmingAppt(true);
    try {
      await clientCancelAppointment(ticketId);
      setClientConfirmation('cancelled');
      toast({ title: 'Consulta cancelada', description: 'O agendamento foi cancelado.' });
    } catch {
      toast({ title: 'Erro ao cancelar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setConfirmingAppt(false);
    }
  };

  const userIsClinic = user?.userType === 'clinic';

  const bubbleClass = (msg: ChatMessage) => {
    if (msg.sender_type === 'system')
      return isEmergency
        ? 'bg-red-50 text-red-900 border border-red-200'
        : 'bg-muted text-muted-foreground border border-border/40';

    const isOwn = userIsClinic
      ? msg.sender_type === 'clinic'
      : msg.sender_type === 'client';

    if (isOwn) return isEmergency ? 'bg-red-600 text-white' : 'bg-primary text-primary-foreground';
    return 'bg-card text-foreground border border-border/40';
  };

  const isOwn = (msg: ChatMessage) => userIsClinic
    ? msg.sender_type === 'clinic'
    : msg.sender_type === 'client';

  // ── Acesso negado (IDOR blocked) ────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Ban className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Acesso negado</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Você não tem permissão para acessar esta conversa.
          </p>
          <Button
            onClick={() => navigate(user?.userType === 'clinic' ? '/clinic-dashboard' : '/my-appointments')}
            className="bg-primary text-white rounded-xl"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isEmergency ? 'linear-gradient(to bottom, #fef2f2, #fff)' : 'hsl(var(--muted)/0.3)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10" style={{
        background: isEmergency
          ? 'linear-gradient(135deg, #dc2626, #ef4444)'
          : 'linear-gradient(135deg, hsl(262 83% 58%), hsl(290 70% 52%))',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(user?.userType === 'clinic' ? '/clinic-dashboard' : '/my-appointments')} className="text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-11 h-11 border-2 border-white/60">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-white text-primary font-bold text-sm">
                {clinicName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight flex items-center gap-1.5">
                {clinicName}{isEmergency && <AlertCircle className="w-4 h-4" />}
              </h2>
              <p className="text-white/80 text-xs">
                {isEmergency ? '🚨 Atendimento prioritário' : '🟢 Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Phone className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-1.5">
                <button onClick={() => toast({ title: 'Denúncia enviada' })}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-amber-50 text-sm text-amber-700">
                  <ShieldAlert className="w-4 h-4" />Denunciar
                </button>
                <button onClick={() => toast({ title: 'Clínica bloqueada', variant: 'destructive' } as any)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600">
                  <Ban className="w-4 h-4" />Bloquear
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5" ref={listRef} onScroll={handleScroll}>
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_type === 'system' ? 'justify-center' : isOwn(msg) ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl px-4 py-2.5 max-w-[78%] ${bubbleClass(msg)}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isOwn(msg) && msg.sender_type !== 'system' ? 'opacity-60' : 'text-muted-foreground'}`}>
                  {msg.created_at
                    ? format(parseISO(msg.created_at), 'HH:mm', { locale: ptBR })
                    : ''}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border/40 shadow-depth-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {isEmergency && !firstMsgSent && (
            <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
              ⚠️ Primeira mensagem limitada a 120 caracteres
            </div>
          )}

          {/* Banner de confirmação de preço — visível só para o cliente */}
          {clientConfirmation === 'pending' && isClientUser && (
            <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-emerald-800">Proposta de agendamento recebida</p>
              {pendingPrice != null && (
                <p className="text-sm text-emerald-700">
                  Valor da consulta:{' '}
                  <span className="font-bold">R$ {pendingPrice.toFixed(2).replace('.', ',')}</span>
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={confirmingAppt}
                  onClick={handleConfirmAppointment}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60">
                  {confirmingAppt ? 'Aguarde…' : '✅ Confirmar consulta'}
                </button>
                <button
                  type="button"
                  disabled={confirmingAppt}
                  onClick={handleCancelAppointment}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors disabled:opacity-60">
                  ❌ Cancelar consulta
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={isEmergency && !firstMsgSent ? 'Descreva a emergência…' : 'Digite sua mensagem… (Shift+Enter para nova linha)'}
                maxLength={maxChars}
                rows={1}
                className="rounded-xl pr-14 text-sm resize-none min-h-[44px] max-h-32 overflow-y-auto"
              />
              {isEmergency && !firstMsgSent && (
                <span className={`absolute right-3 bottom-3 text-[11px] font-medium tabular-nums ${input.length > 110 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {input.length}/120
                </span>
              )}
            </div>
            <Button type="submit" disabled={!input.trim() || sending}
              className={`h-11 w-11 p-0 rounded-xl text-white flex-shrink-0 ${isEmergency ? 'bg-red-600 hover:bg-red-700' : 'gradient-purple hover:opacity-90'}`}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
