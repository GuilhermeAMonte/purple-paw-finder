import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchClientTickets, cancelTicket, sendMessage, type Ticket } from '@/lib/tickets';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'Pendente',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'Aprovado',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Recusado',  cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground border-border' };
  return (
    <span className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${s.cls}`}>
      {s.label}
    </span>
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'approved') return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
  if (status === 'rejected')  return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
  return <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
};

const MyAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

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

          {loading ? (
            <div className="space-y-4">
              {[0,1,2].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/40 p-12 text-center shadow-depth-sm">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">Nenhum agendamento ainda</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Busque uma clínica e abra seu primeiro chamado.</p>
              <Button className="mt-4 gradient-purple text-white rounded-xl" onClick={() => navigate('/')}>
                Buscar clínicas
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-card rounded-2xl border border-border/40 shadow-depth-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/30 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <StatusIcon status={ticket.approval_status} />
                      <div>
                        <p className="font-semibold text-foreground">{ticket.clinic_name ?? 'Clínica'}</p>
                        <p className="text-sm text-muted-foreground">{ticket.service}</p>
                      </div>
                    </div>
                    <StatusBadge status={ticket.approval_status} />
                  </div>

                  <div className="px-6 py-4 space-y-3">
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {ticket.scheduled_date
                          ? format(parseISO(ticket.scheduled_date), "d 'de' MMMM yyyy", { locale: ptBR })
                          : '—'}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {ticket.scheduled_time}
                      </span>
                    </div>

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

                    {ticket.approval_status === 'rejected' && ticket.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs font-medium text-red-800 mb-1">Motivo da recusa:</p>
                        <p className="text-sm text-red-700">{ticket.rejection_reason}</p>
                      </div>
                    )}

                    {ticket.approval_status === 'approved' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-sm font-medium text-emerald-800">
                          ✓ Agendamento confirmado! Compareça no horário marcado.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs"
                        onClick={() => navigate(`/chat/${ticket.id}`)}>
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Abrir chat
                      </Button>
                      {ticket.approval_status === 'pending' && (
                        <Button size="sm" variant="outline"
                          className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleCancel(ticket.id)}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
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
