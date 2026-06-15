import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, User, PawPrint, CheckCircle, XCircle, MessageSquare, Stethoscope, Loader2, AlertCircle, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { approveTicket, rejectTicket, sendMessage, type Ticket } from '@/lib/tickets';
import {
  fetchVeterinarians, fetchClinicAppointmentsByDate, isVetWorking, bookVetSlot,
  type Veterinarian, type VetAppointment,
} from '@/lib/veterinarians';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  appointments: Ticket[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type VetAvailability = 'available' | 'busy' | 'off';

const AppointmentApproval: React.FC<Props> = ({ appointments, onApprove, onReject }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  /* Aprovação com vínculo de veterinário */
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Ticket | null>(null);
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [dayAppts, setDayAppts] = useState<VetAppointment[]>([]);
  const [loadingVets, setLoadingVets] = useState(false);
  const [selectedVetId, setSelectedVetId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const openApprove = async (ticket: Ticket) => {
    if (!user?.id) return;
    setApproveTarget(ticket);
    setSelectedVetId(null);
    setApproveOpen(true);
    setLoadingVets(true);
    try {
      const [vetList, appts] = await Promise.all([
        fetchVeterinarians(user.id),
        fetchClinicAppointmentsByDate(user.id, ticket.scheduled_date),
      ]);
      setVets(vetList);
      setDayAppts(appts);
    } catch {
      toast({ title: 'Erro ao carregar veterinários', variant: 'destructive' });
      setApproveOpen(false);
    } finally {
      setLoadingVets(false);
    }
  };

  const vetAvailability = (vet: Veterinarian): VetAvailability => {
    if (!approveTarget) return 'off';
    const time = approveTarget.scheduled_time.slice(0, 5);
    if (!isVetWorking(vet, approveTarget.scheduled_date, time)) return 'off';
    const busy = dayAppts.some(a => a.vet_id === vet.id && a.time.slice(0, 5) === time);
    return busy ? 'busy' : 'available';
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget || !selectedVetId || !user?.id) return;
    const vet = vets.find(v => v.id === selectedVetId);
    if (!vet || vetAvailability(vet) !== 'available') return;

    setApproving(true);
    try {
      await approveTicket(approveTarget.id);
      await bookVetSlot({
        vet_id: vet.id,
        clinic_id: user.id,
        ticket_id: approveTarget.id,
        date: approveTarget.scheduled_date,
        time: approveTarget.scheduled_time.slice(0, 5),
        status: 'booked',
        patient_name: approveTarget.client_name ?? 'Cliente',
        patient_pet: `${approveTarget.pet_name} (${approveTarget.pet_species})`,
        patient_notes: approveTarget.description,
      });
      await sendMessage(approveTarget.id, user.id, 'system',
        `✅ Agendamento confirmado para ${format(parseISO(approveTarget.scheduled_date), "d 'de' MMMM", { locale: ptBR })} às ${approveTarget.scheduled_time.slice(0, 5)} com ${vet.name}.`);
      onApprove(approveTarget.id);
      setApproveOpen(false);
      toast({ title: 'Agendamento aprovado', description: `${approveTarget.client_name} confirmado com ${vet.name}.` });
    } catch {
      toast({ title: 'Erro ao aprovar', variant: 'destructive' });
    } finally {
      setApproving(false);
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
                <Button onClick={() => openApprove(ticket)} size="sm"
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

      {/* ── Aprovar: vincular veterinário ─────────────────────────────── */}
      <Dialog open={approveOpen} onOpenChange={v => { if (!approving) setApproveOpen(v); }}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Veterinário</DialogTitle>
            <DialogDescription>
              {approveTarget && (
                <>Selecione quem atenderá {approveTarget.client_name ?? 'o cliente'} em{' '}
                {format(parseISO(approveTarget.scheduled_date), "d 'de' MMMM", { locale: ptBR })} às {approveTarget.scheduled_time.slice(0, 5)}.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {loadingVets ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : vets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <p className="font-medium text-sm text-foreground mb-1">Nenhum veterinário cadastrado</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Cadastre ao menos um veterinário com seus dias e horários de atendimento para poder aprovar consultas.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {vets.map(vet => {
                  const availability = vetAvailability(vet);
                  const isSelected = selectedVetId === vet.id;
                  const disabled = availability !== 'available';
                  return (
                    <button
                      key={vet.id}
                      disabled={disabled}
                      onClick={() => setSelectedVetId(vet.id)}
                      className={`w-full text-left border rounded-xl p-3.5 smooth-transition ${
                        disabled
                          ? 'bg-red-50/70 border-red-200 cursor-not-allowed'
                          : isSelected
                            ? 'border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-200'
                            : 'border-border/50 hover:border-emerald-300 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          disabled ? 'bg-red-100' : 'gradient-purple'
                        }`}>
                          {disabled
                            ? <Ban className="w-4 h-4 text-red-400" />
                            : <Stethoscope className="w-4 h-4 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold text-sm truncate ${disabled ? 'text-red-700/70' : 'text-foreground'}`}>
                            {vet.name}
                          </p>
                          <p className={`text-[11px] ${disabled ? 'text-red-500/70' : 'text-muted-foreground'}`}>
                            {(vet.work_days ?? []).slice().sort((a, b) => a - b).map(d => DAY_LABELS[d]).join(', ')} · {vet.work_start}–{vet.work_end}
                          </p>
                        </div>
                        {availability === 'available' && (
                          <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 flex-shrink-0">
                            Disponível
                          </span>
                        )}
                        {availability === 'busy' && (
                          <span className="text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5 flex-shrink-0">
                            Ocupado neste horário
                          </span>
                        )}
                        {availability === 'off' && (
                          <span className="text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5 flex-shrink-0">
                            Fora do expediente
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={approving} className="flex-1 rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={handleApproveConfirm}
                disabled={approving || !selectedVetId || vets.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {approving
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Aprovando…</>
                  : <><CheckCircle className="w-4 h-4 mr-2" />Aprovar consulta</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Recusar ───────────────────────────────────────────────────── */}
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
