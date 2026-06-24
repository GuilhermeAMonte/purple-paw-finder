import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  MessageSquare, PawPrint, Activity, Receipt, FileText, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchClientTickets, cancelTicket, sendMessage, type Ticket } from '@/lib/tickets';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Tab = 'pending' | 'active' | 'completed' | 'rejected';

const TAB_CONFIG: Record<Tab, {
  label: string;
  icon: React.ReactNode;
  emptyMsg: string;
  emptyHint: string;
  color: string;
}> = {
  pending: {
    label: 'Pendentes',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    emptyMsg: 'Nenhum agendamento pendente',
    emptyHint: 'Agendamentos aguardando resposta da clínica aparecerão aqui.',
    color: 'amber',
  },
  active: {
    label: 'Em andamento',
    icon: <Activity className="w-3.5 h-3.5" />,
    emptyMsg: 'Nenhuma consulta em andamento',
    emptyHint: 'Consultas confirmadas aguardando atendimento aparecerão aqui.',
    color: 'blue',
  },
  completed: {
    label: 'Concluídos',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    emptyMsg: 'Nenhuma consulta concluída',
    emptyHint: 'Atendimentos finalizados pela clínica aparecerão aqui.',
    color: 'emerald',
  },
  rejected: {
    label: 'Recusados',
    icon: <XCircle className="w-3.5 h-3.5" />,
    emptyMsg: 'Nenhum agendamento recusado',
    emptyHint: 'Agendamentos recusados ou cancelados aparecerão aqui.',
    color: 'red',
  },
};

const COLOR_MAP: Record<string, string> = {
  amber:   'bg-amber-100 text-amber-700',
  blue:    'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  red:     'bg-red-100 text-red-700',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'approved' || status === 'completed') return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
  if (status === 'rejected') return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
  return <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
};

const TicketCard = ({
  ticket,
  tab,
  onCancel,
  onChat,
}: {
  ticket: Ticket;
  tab: Tab;
  onCancel: (id: string) => void;
  onChat: (id: string) => void;
}) => (
  <div className="bg-card rounded-2xl border border-border/40 shadow-depth-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-border/30 flex items-start gap-3">
      <StatusIcon status={ticket.approval_status} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{ticket.clinic_name ?? 'Clínica'}</p>
        <p className="text-sm text-muted-foreground">{ticket.service}</p>
      </div>
    </div>

    <div className="px-6 py-4 space-y-3">
      {/* Date / time */}
      <div className="flex items-center gap-6 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {ticket.scheduled_date
            ? format(parseISO(ticket.scheduled_date), "d 'de' MMMM yyyy", { locale: ptBR })
            : '—'}
        </span>
        {ticket.scheduled_time && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {ticket.scheduled_time}
          </span>
        )}
      </div>

      {/* Pet info */}
      <div className="bg-muted/40 rounded-xl p-3 border border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <PawPrint className="w-3.5 h-3.5 text-primary/70" />
          <span className="text-xs font-medium text-muted-foreground">
            {ticket.pet_name} · {ticket.pet_species}
          </span>
        </div>
        <p className="font-medium text-sm text-foreground">{ticket.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{ticket.description}</p>
      </div>

      {/* Rejected reason */}
      {ticket.approval_status === 'rejected' && ticket.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-medium text-red-800 mb-1">Motivo da recusa:</p>
          <p className="text-sm text-red-700">{ticket.rejection_reason}</p>
        </div>
      )}

      {/* Pending price proposal */}
      {ticket.client_confirmation === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm font-medium text-blue-800">
            💬 Proposta recebida — abra o chat para confirmar ou cancelar.
          </p>
        </div>
      )}

      {/* Em andamento banner */}
      {tab === 'active' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm font-medium text-blue-800">
            🩺 Consulta confirmada. Compareça no horário marcado.
          </p>
        </div>
      )}

      {/* Completion details */}
      {tab === 'completed' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Resumo do atendimento</p>
          {ticket.final_amount != null && (
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <Receipt className="w-4 h-4 flex-shrink-0" />
              <span>Valor cobrado: <strong>R$ {ticket.final_amount.toFixed(2).replace('.', ',')}</strong></span>
            </div>
          )}
          {ticket.treatment_summary && (
            <div className="flex items-start gap-2 text-sm text-emerald-800">
              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="whitespace-pre-line">{ticket.treatment_summary}</p>
            </div>
          )}
          {ticket.payment_proof_url && (
            <a
              href={ticket.payment_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              Ver comprovante de pagamento
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" className="rounded-xl text-xs"
          onClick={() => onChat(ticket.id)}>
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Abrir chat
        </Button>
        {tab === 'pending' && ticket.approval_status === 'pending' && (
          <Button size="sm" variant="outline"
            className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => onCancel(ticket.id)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  </div>
);

const MyAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  useEffect(() => {
    if (!user?.id) return;
    fetchClientTickets(user.id)
      .then(setTickets)
      .catch(() => toast({ title: 'Erro ao carregar agendamentos', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (ticketId: string) => {
    try {
      await cancelTicket(ticketId);
      await sendMessage(ticketId, '', 'system', '❌ O cliente cancelou a consulta agendada.');
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      toast({ title: 'Agendamento cancelado' });
    } catch {
      toast({ title: 'Erro ao cancelar', variant: 'destructive' });
    }
  };

  const byTab: Record<Tab, Ticket[]> = {
    pending:   tickets.filter(t => t.approval_status === 'pending'  && t.status !== 'cancelled' && t.status !== 'completed'),
    active:    tickets.filter(t => t.approval_status === 'approved' && t.status !== 'completed' && t.status !== 'cancelled'),
    completed: tickets.filter(t => t.status === 'completed'),
    rejected:  tickets.filter(t => t.approval_status === 'rejected' || t.status === 'cancelled'),
  };

  const listed = byTab[activeTab];
  const cfg = TAB_CONFIG[activeTab];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>

          <div className="bg-card rounded-3xl p-8 border border-border/40 shadow-depth-sm mb-6">
            <h1 className="text-3xl font-semibold text-foreground mb-1">Meus Agendamentos</h1>
            <p className="text-muted-foreground">Acompanhe o status dos seus chamados</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-2xl p-1.5 mb-6">
            {(Object.keys(TAB_CONFIG) as Tab[]).map(tab => {
              const active = activeTab === tab;
              const count = byTab[tab].length;
              const tc = TAB_CONFIG[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium smooth-transition ${
                    active ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tc.icon}
                  <span className="hidden sm:inline">{tc.label}</span>
                  <span className="sm:hidden">{tc.label.split(' ')[0]}</span>
                  {count > 0 && (
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                      active ? COLOR_MAP[tc.color] : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
            </div>
          ) : listed.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/40 p-12 text-center shadow-depth-sm">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">{cfg.emptyMsg}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{cfg.emptyHint}</p>
              {activeTab === 'pending' && (
                <Button className="mt-4 gradient-purple text-white rounded-xl" onClick={() => navigate('/')}>
                  Buscar clínicas
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {listed.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  tab={activeTab}
                  onCancel={handleCancel}
                  onChat={id => navigate(`/chat/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyAppointments;
