import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, User, PawPrint, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { approveTicket, rejectTicket, sendMessage, type Ticket } from '@/lib/tickets';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  appointments: Ticket[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const AppointmentApproval: React.FC<Props> = ({ appointments, onApprove, onReject }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async (ticket: Ticket) => {
    try {
      await approveTicket(ticket.id);
      if (user?.id) {
        await sendMessage(ticket.id, user.id, 'system',
          `✅ Agendamento confirmado para ${format(parseISO(ticket.scheduled_date), "d 'de' MMMM", { locale: ptBR })} às ${ticket.scheduled_time}.`);
      }
      onApprove(ticket.id);
      toast({ title: 'Agendamento aprovado', description: `Consulta de ${ticket.client_name} confirmada.` });
    } catch {
      toast({ title: 'Erro ao aprovar', variant: 'destructive' });
    }
  };

  const handleRejectConfirm = async () => {
    if (!reason.trim()) {
      toast({ title: 'Informe o motivo', variant: 'destructive' });
      return;
    }
    if (!selected) return;
    setLoading(true);
    try {
      await rejectTicket(selected.id, reason.trim());
      if (user?.id) {
        await sendMessage(selected.id, user.id, 'system',
          `❌ Agendamento recusado.\n\nMotivo: ${reason.trim()}`);
      }
      onReject(selected.id, reason.trim());
      setRejectOpen(false);
      setReason('');
      setSelected(null);
      toast({ title: 'Agendamento recusado', description: 'O cliente foi notificado.' });
    } catch {
      toast({ title: 'Erro ao recusar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const pending = appointments.filter(a => a.approval_status === 'pending');

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-muted-foreground/60">
        <Calendar className="w-10 h-10 mb-2" />
        <p className="text-sm">Nenhum agendamento pendente</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pending.map(ticket => (
          <div key={ticket.id} className="border border-amber-200 bg-amber-50/40 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200/60 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{ticket.client_name ?? 'Cliente'}</p>
                  <p className="text-xs text-muted-foreground">{ticket.service}</p>
                </div>
              </div>
              <span className="text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                Pendente
              </span>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {ticket.scheduled_date
                    ? format(parseISO(ticket.scheduled_date), "d 'de' MMMM", { locale: ptBR })
                    : '—'}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />{ticket.scheduled_time}
                </span>
              </div>

              <div className="bg-background rounded-xl p-3 border border-border/40">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <PawPrint className="w-3.5 h-3.5 text-primary/70" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {ticket.pet_name} · {ticket.pet_species}
                  </span>
                </div>
                <p className="font-medium text-sm text-foreground">{ticket.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-3">{ticket.description}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleApprove(ticket)} size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />Aprovar
                </Button>
                <Button onClick={() => { setSelected(ticket); setRejectOpen(true); }} size="sm"
                  variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs h-9">
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />Recusar
                </Button>
                <Button onClick={() => navigate(`/chat/${ticket.id}`)} size="sm"
                  variant="outline" className="rounded-xl text-xs h-9 px-3">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Recusar Agendamento</DialogTitle>
            <DialogDescription>
              Explique o motivo e sugira horários alternativos ao cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: O horário solicitado está ocupado. Temos disponibilidade às 10:00 ou 14:30…"
              rows={4}
              className="rounded-xl resize-none"
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)} className="flex-1 rounded-xl">
                Cancelar
              </Button>
              <Button onClick={handleRejectConfirm} disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                {loading ? 'Recusando…' : 'Confirmar Recusa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentApproval;
