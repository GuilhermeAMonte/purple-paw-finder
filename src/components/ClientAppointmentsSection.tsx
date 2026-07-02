import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, ChevronRight, PawPrint } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientTickets, type Ticket } from '@/lib/tickets';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pendente',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Confirmado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Recusado',   cls: 'bg-red-50 text-red-700 border-red-200' },
};

const ClientAppointmentsSection = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || user.userType !== 'client') {
      setLoading(false);
      return;
    }
    fetchClientTickets(user.id)
      .then(data => setTickets(data.filter(t => t.status !== 'cancelled').slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!isAuthenticated || user?.userType !== 'client') return null;
  if (loading) return null;
  if (tickets.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-0">
      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/15 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-purple flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Meus Agendamentos</span>
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
              {tickets.length}
            </span>
          </div>
          <button
            onClick={() => navigate('/my-appointments')}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {tickets.map(ticket => {
            const st = STATUS[ticket.approval_status] ?? STATUS.pending;
            return (
              <button
                key={ticket.id}
                onClick={() => navigate(`/chat/${ticket.id}`)}
                className="w-full text-left bg-background/80 border border-border/40 rounded-xl px-4 py-3 hover:border-primary/30 hover:bg-background smooth-transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-4 h-4 text-primary/70" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {ticket.clinic_name ?? 'Clínica'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{ticket.service}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {ticket.scheduled_date && (
                    <div className="hidden sm:flex flex-col items-end gap-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(ticket.scheduled_date), "d MMM", { locale: ptBR })}
                      </span>
                      {ticket.scheduled_time && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {ticket.scheduled_time}
                        </span>
                      )}
                    </div>
                  )}
                  <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 ${st.cls}`}>
                    {st.label}
                  </span>
                  <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary smooth-transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ClientAppointmentsSection;
