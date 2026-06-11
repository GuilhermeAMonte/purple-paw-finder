import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PawPrint, Phone, Users, MessageSquare, Settings, LogOut,
  Clock, Calendar, Send, UserCheck, AlertCircle, CheckSquare,
  BarChart2, Activity, ChevronLeft, ChevronRight,
  Stethoscope, FileText, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import AppointmentApproval from '@/components/AppointmentApproval';
import VetScheduleDialog from '@/components/VetScheduleDialog';
import {
  VetAppointment,
  fetchClinicAppointmentsByDate,
  fetchClinicMonthAppointments,
} from '@/lib/veterinarians';
import {
  fetchClinicTickets,
  sendMessage as sendTicketMessage,
  type Ticket,
} from '@/lib/tickets';
import { supabase } from '@/lib/supabase';

const SPECIALTIES = [
  'General Practice','Surgery','Cardiology','Dermatology','Ophthalmology',
  'Oncology','Orthopedics','Neurology','Emergency','Vaccination',
  'Laboratory Tests','Ultrasound','Radiology','Physiotherapy','Veterinary Dentistry',
];

/* ── Sub-components ─────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels: Record<string, string> = {
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-medium border rounded-full px-2 py-0.5 ${map[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {labels[status] ?? status}
    </span>
  );
};

const KpiCard = ({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) => (
  <div className="kpi-card animate-fade-in-up">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-bold text-foreground tracking-tight mb-1">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const AppointmentDetailModal = ({
  appt, open, onClose,
}: {
  appt: (VetAppointment & { vet_name?: string }) | null;
  open: boolean;
  onClose: () => void;
}) => {
  if (!appt) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Appointment Details</DialogTitle>
          <DialogDescription>
            {appt.date ? format(parseISO(appt.date), 'EEEE, MMMM d, yyyy', { locale: enUS }) : ''} · {appt.time}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 border border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Veterinarian</p>
              <p className="font-semibold text-sm text-foreground">{appt.vet_name ?? '—'}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 border border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Patient</p>
              <p className="font-semibold text-sm text-foreground">{appt.patient_name ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{appt.patient_pet ?? ''}</p>
            </div>
          </div>
          {appt.patient_notes && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-[10px] text-primary/70 uppercase tracking-wide mb-1.5">Patient notes</p>
              <p className="text-sm text-foreground leading-relaxed">{appt.patient_notes}</p>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Status: <span className="font-medium text-emerald-600 capitalize">{appt.status}</span></span>
            {appt.ticket_id && <span>Ticket: {appt.ticket_id.slice(0, 8)}…</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Main Dashboard ─────────────────────────────────────────────────── */
const ClinicDashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const clinicId = user?.id ?? '';

  const [section, setSection] = useState('aprovacoes');

  /* Tickets from Supabase */
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const firstLoad = useRef(true);

  /* Selected ticket for contacts panel */
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  /* VetSchedule */
  const [vetScheduleOpen, setVetScheduleOpen] = useState(false);

  /* Calendar */
  const [calDate, setCalDate] = useState<Date | undefined>(new Date());
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [monthAppts, setMonthAppts] = useState<(VetAppointment & { vet_name: string })[]>([]);
  const [dayAppts,   setDayAppts]   = useState<(VetAppointment & { vet_name: string })[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [detailAppt, setDetailAppt] = useState<(VetAppointment & { vet_name?: string }) | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  /* Profile */
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    clinicName: (user as any)?.clinicName || '',
    phone:      (user as any)?.phone      || '',
    address:    (user as any)?.address    || '',
    description:(user as any)?.description|| '',
    is24Hours:  (user as any)?.is24Hours  || false,
    specialties:(user as any)?.specialties|| [],
  });

  /* ── Load tickets ──────────────────────────────────────────────── */
  const loadTickets = useCallback(async () => {
    if (!clinicId) return;
    setLoadingTickets(true);
    try {
      const data = await fetchClinicTickets(clinicId);
      setTickets(data);
      if (firstLoad.current && data.length > 0) setSelectedTicket(data[0]);
      firstLoad.current = false;
    } catch {
      // silently ignore
    } finally {
      setLoadingTickets(false);
    }
  }, [clinicId]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  /* ── Realtime subscription for new/updated tickets ─────────────── */
  useEffect(() => {
    if (!clinicId) return;
    const db = supabase as any;
    const channel = db
      .channel(`tickets-clinic-${clinicId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets',
        filter: `clinic_id=eq.${clinicId}`,
      }, async (payload: any) => {
        const { data } = await db
          .from('tickets')
          .select('*, profiles(name)')
          .eq('id', payload.new.id)
          .single();
        if (data) {
          const ticket: Ticket = { ...data, client_name: data.profiles?.name ?? null };
          setTickets(prev => [ticket, ...prev]);
          toast({ title: 'Novo chamado recebido!', description: `${ticket.client_name ?? 'Cliente'} · ${ticket.service}` });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `clinic_id=eq.${clinicId}`,
      }, (payload: any) => {
        setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
      })
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, [clinicId]);

  /* ── Load calendar month appointments ──────────────────────────── */
  const loadMonthAppts = useCallback(async () => {
    if (!clinicId) return;
    setLoadingAppts(true);
    try {
      const data = await fetchClinicMonthAppointments(clinicId, calYear, calMonth);
      setMonthAppts(data);
    } catch { /* ignore */ } finally {
      setLoadingAppts(false);
    }
  }, [clinicId, calYear, calMonth]);

  useEffect(() => {
    if (['calendario', 'horarios', 'pacientes'].includes(section)) loadMonthAppts();
  }, [section, loadMonthAppts]);

  /* ── Load day appointments ─────────────────────────────────────── */
  useEffect(() => {
    if (!calDate || !clinicId) return;
    fetchClinicAppointmentsByDate(clinicId, format(calDate, 'yyyy-MM-dd'))
      .then(setDayAppts).catch(() => setDayAppts([]));
  }, [calDate, clinicId]);

  /* ── Derived ───────────────────────────────────────────────────── */
  const pendingTickets  = tickets.filter(t => t.approval_status === 'pending');
  const todayStr        = format(new Date(), 'yyyy-MM-dd');

  /* Tickets aprovados entram na agenda como consultas (sem duplicar os
     que já viraram agendamento com veterinário via VetScheduleDialog). */
  const ticketAppts: (VetAppointment & { vet_name: string })[] = tickets
    .filter(t => t.approval_status === 'approved' && t.scheduled_date && t.scheduled_time)
    .map(t => ({
      id: `ticket-${t.id}`,
      vet_id: '',
      clinic_id: t.clinic_id,
      ticket_id: t.id,
      date: t.scheduled_date,
      time: t.scheduled_time.slice(0, 5),
      status: 'booked' as const,
      patient_name: t.client_name ?? 'Cliente',
      patient_pet: `${t.pet_name} (${t.pet_species})`,
      patient_notes: t.description,
      created_at: t.created_at,
      vet_name: t.service,
    }));

  const monthTicketAppts = ticketAppts.filter(a => {
    const d = parseISO(a.date);
    return d.getFullYear() === calYear && d.getMonth() + 1 === calMonth
      && !monthAppts.some(m => m.ticket_id === a.ticket_id);
  });
  const allMonthAppts   = [...monthAppts, ...monthTicketAppts];

  const apptDates       = new Set(allMonthAppts.map(a => a.date));
  const todayAppts      = allMonthAppts.filter(a => a.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));
  const scheduleAppts   = allMonthAppts.filter(a => a.date === scheduleDate);

  const calDateStr  = calDate ? format(calDate, 'yyyy-MM-dd') : null;
  const calDayAppts = [
    ...dayAppts,
    ...ticketAppts.filter(a => a.date === calDateStr && !dayAppts.some(d => d.ticket_id === a.ticket_id)),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const emergencyTickets = tickets.filter(t => t.is_emergency);
  const regularTickets  = tickets.filter(t => !t.is_emergency);

  /* ── Approval callbacks (AppointmentApproval handles Supabase) ── */
  const handleApprove = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, approval_status: 'approved' as const, status: 'confirmed' as const } : t));
  };
  const handleReject = (id: string, reason: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, approval_status: 'rejected' as const, rejection_reason: reason } : t));
  };

  /* ── Quick reply (sends via Supabase chat_messages) ────────────── */
  const handleSend = async () => {
    if (!replyMsg.trim() || !selectedTicket || !user) return;
    setSendingReply(true);
    try {
      await sendTicketMessage(selectedTicket.id, user.id, 'clinic', replyMsg.trim());
      setReplyMsg('');
      toast({ title: 'Mensagem enviada' });
    } catch {
      toast({ title: 'Erro ao enviar', variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  /* ── Profile save ──────────────────────────────────────────────── */
  const handleProfileSave = async () => {
    try {
      await updateUserProfile(profileData);
      setProfileOpen(false);
      toast({ title: 'Perfil atualizado' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  /* ── New appointment booked ────────────────────────────────────── */
  const handleBooked = (appt: VetAppointment & { vet_name: string }) => {
    setMonthAppts(prev => [...prev, appt]);
    if (appt.date === todayStr) setDayAppts(prev => [...prev, appt]);
    toast({ title: 'Consulta agendada!', description: `${appt.patient_name} — ${appt.time}` });
  };

  /* ── Nav items ─────────────────────────────────────────────────── */
  const navItems = [
    { id: 'aprovacoes',  label: 'Aprovações',  icon: CheckSquare, badge: pendingTickets.length || undefined },
    { id: 'contatos',    label: 'Contatos',    icon: MessageSquare },
    { id: 'emergencias', label: 'Emergências', icon: AlertCircle, badge: emergencyTickets.length || undefined, badgeColor: 'bg-red-500' },
    { id: 'calendario',  label: 'Calendário',  icon: Calendar },
    { id: 'pacientes',   label: 'Pacientes',   icon: UserCheck },
    { id: 'horarios',    label: 'Horários',    icon: Clock },
  ];

  const kpis = [
    { icon: BarChart2,   label: 'Consultas no mês',    value: allMonthAppts.length,    color: 'bg-violet-100 text-violet-600' },
    { icon: CheckSquare, label: 'Pendentes de aprovação', value: pendingTickets.length, color: 'bg-amber-100 text-amber-600' },
    { icon: Users,       label: 'Pacientes hoje',       value: todayAppts.length,       color: 'bg-blue-100 text-blue-600' },
    { icon: Activity,    label: 'Chamados abertos',     value: tickets.filter(t => t.status !== 'cancelled').length, color: 'bg-emerald-100 text-emerald-600' },
  ];

  /* ── Contacts/Emergencies panel ────────────────────────────────── */
  const renderContactsSection = (emergency: boolean) => {
    const list = emergency ? emergencyTickets : regularTickets;
    const active = selectedTicket && (emergency ? selectedTicket.is_emergency : !selectedTicket.is_emergency)
      ? selectedTicket
      : list[0] ?? null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up">
        {/* Ticket list */}
        <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
          <div className={`px-5 py-4 border-b border-border/40 flex-shrink-0 ${emergency ? 'bg-red-50/50' : ''}`}>
            <div className="flex items-center gap-2">
              {emergency ? <AlertCircle className="w-4 h-4 text-red-600" /> : <Users className="w-4 h-4 text-primary" />}
              <h3 className={`font-semibold text-sm ${emergency ? 'text-red-700' : 'text-foreground'}`}>
                {emergency ? 'Emergências' : 'Chamados'} · {list.length}
              </h3>
            </div>
          </div>
          <div className="overflow-y-auto divide-y divide-border/30 flex-1">
            {loadingTickets ? (
              <div className="space-y-2 p-3">{[0,1,2].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
            ) : list.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground/60 text-sm">
                Nenhum chamado
              </div>
            ) : list.map(ticket => (
              <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                className={`w-full text-left p-4 smooth-transition ${
                  active?.id === ticket.id
                    ? emergency ? 'bg-red-50 border-l-2 border-l-red-500' : 'bg-primary/5 border-l-2 border-l-primary'
                    : emergency ? 'hover:bg-red-50/50' : 'hover:bg-muted/40'
                }`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground line-clamp-1">{ticket.client_name ?? 'Cliente'}</span>
                  <StatusBadge status={ticket.approval_status} />
                </div>
                <p className="text-xs text-muted-foreground">{ticket.service} · {ticket.pet_name}</p>
                <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">{ticket.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket detail + quick reply */}
        <div className={`lg:col-span-2 bg-background border rounded-2xl shadow-depth-sm overflow-hidden flex flex-col ${emergency ? 'border-red-200' : 'border-border/50'}`}
          style={{ maxHeight: 'calc(100vh - 16rem)' }}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground/60 text-sm">
              Selecione um chamado
            </div>
          ) : (
            <>
              <div className={`px-5 py-4 border-b flex items-start justify-between flex-shrink-0 ${emergency ? 'bg-red-50/50 border-red-200' : 'border-border/40'}`}>
                <div>
                  <h3 className={`font-semibold text-sm ${emergency ? 'text-red-700' : 'text-foreground'}`}>
                    {emergency && <AlertCircle className="inline w-4 h-4 mr-1 -mt-0.5" />}
                    {active.client_name} · {active.pet_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{active.service} · {active.scheduled_date ? format(parseISO(active.scheduled_date), "d 'de' MMM", { locale: ptBR }) : '—'} {active.scheduled_time}</p>
                </div>
                <StatusBadge status={active.approval_status} />
              </div>

              {/* Case description */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className={`rounded-xl p-4 border ${emergency ? 'bg-red-50/50 border-red-100' : 'bg-muted/30 border-border/30'}`}>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Motivo do chamado</p>
                  <p className="font-medium text-sm text-foreground">{active.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{active.description}</p>
                </div>

                {active.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-[11px] text-red-700 uppercase tracking-wide mb-1">Motivo da recusa</p>
                    <p className="text-sm text-red-800">{active.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 pt-3 border-t border-border/40 space-y-2 flex-shrink-0">
                <div className="flex gap-2">
                  <Input placeholder="Resposta rápida…" value={replyMsg}
                    onChange={e => setReplyMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className={`flex-1 rounded-xl text-sm ${emergency ? 'border-red-200' : ''}`} />
                  <Button onClick={handleSend} disabled={!replyMsg.trim() || sendingReply} size="sm"
                    className={`h-10 w-10 p-0 rounded-xl text-white ${emergency ? 'bg-red-600 hover:bg-red-700' : 'gradient-purple hover:opacity-90'}`}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => navigate(`/chat/${active.id}`)}
                    className={`flex-1 rounded-xl text-xs ${emergency ? 'border-red-200 text-red-700 hover:bg-red-50' : ''}`}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Abrir chat completo
                  </Button>
                  {!emergency && (
                    <Button size="sm" onClick={() => setVetScheduleOpen(true)}
                      className="flex-1 rounded-xl text-xs gradient-purple text-white hover:opacity-90">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />Agendar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <VetScheduleDialog
          open={vetScheduleOpen}
          onOpenChange={setVetScheduleOpen}
          clinicId={clinicId}
          patientName={active?.client_name ?? ''}
          patientPet={active ? `${active.pet_name} (${active.pet_species})` : ''}
          patientNotes={active?.description}
          ticketId={active?.id}
          onBooked={handleBooked}
        />
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-muted/30">

      {/* Header */}
      <header className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-purple rounded-xl flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[15px] font-semibold text-foreground">Paw<span className="text-primary">Connect</span></span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">
              Olá, <span className="font-medium text-foreground">{user?.name?.split(' ')[0]}</span>
            </span>
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/60 group">
                  <Settings className="w-4 h-4 text-muted-foreground transition-transform duration-500 group-hover:rotate-90" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Perfil da Clínica</DialogTitle>
                  <DialogDescription>Atualize as informações da sua clínica</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nome da Clínica</Label>
                      <Input value={profileData.clinicName} onChange={e => setProfileData(p => ({ ...p, clinicName: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <Input value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Endereço</Label>
                    <Input value={profileData.address} onChange={e => setProfileData(p => ({ ...p, address: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Textarea value={profileData.description} onChange={e => setProfileData(p => ({ ...p, description: e.target.value }))} className="rounded-xl resize-none" rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="24h" checked={profileData.is24Hours} onCheckedChange={c => setProfileData(p => ({ ...p, is24Hours: !!c }))} />
                    <Label htmlFor="24h" className="cursor-pointer">Atendimento 24h</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Especialidades</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPECIALTIES.map(spec => (
                        <div key={spec} className="flex items-center gap-2">
                          <Checkbox id={spec} checked={profileData.specialties.includes(spec)}
                            onCheckedChange={c => setProfileData(p => ({
                              ...p,
                              specialties: c ? [...p.specialties, spec] : p.specialties.filter((s: string) => s !== spec),
                            }))} />
                          <Label htmlFor={spec} className="text-sm cursor-pointer">{spec}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleProfileSave} className="w-full rounded-xl gradient-purple text-white hover:opacity-90">
                    Salvar Alterações
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }}
              className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 smooth-transition">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {loadingTickets && firstLoad.current
            ? [0,1,2,3].map(i => (
                <div key={i} className="kpi-card">
                  <div className="w-10 h-10 skeleton rounded-xl mb-4" />
                  <div className="h-7 w-12 skeleton rounded-lg mb-2" />
                  <div className="h-4 w-28 skeleton rounded-md" />
                </div>
              ))
            : kpis.map(k => <KpiCard key={k.label} {...k} />)
          }
        </div>

        {/* Nav tabs */}
        <div className="bg-background border border-border/50 rounded-2xl p-1.5 shadow-depth-sm overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {navItems.map(({ id, label, icon: Icon, badge, badgeColor }) => (
              <button key={id} onClick={() => setSection(id)}
                className={`nav-item ${section === id ? 'active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {badge ? (
                  <span className={`ml-1 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 ${
                    section === id ? 'bg-white/25 text-white' : badgeColor ? `${badgeColor} text-white` : 'bg-primary/15 text-primary'
                  }`}>{badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* ── APPROVALS ──────────────────────────────────────────────── */}
        {section === 'aprovacoes' && (
          <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 border-b border-border/40 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Aprovações Pendentes</h3>
                <p className="text-sm text-muted-foreground">{pendingTickets.length} chamado(s) aguardando</p>
              </div>
            </div>
            <div className="p-6">
              {loadingTickets
                ? <div className="space-y-4">{[0,1,2].map(i => <div key={i} className="h-40 skeleton rounded-2xl" />)}</div>
                : <AppointmentApproval appointments={pendingTickets} onApprove={handleApprove} onReject={handleReject} />
              }
            </div>
          </div>
        )}

        {/* ── CONTACTS ─────────────────────────────────────────────── */}
        {section === 'contatos' && renderContactsSection(false)}

        {/* ── EMERGENCIES ──────────────────────────────────────────── */}
        {section === 'emergencias' && renderContactsSection(true)}

        {/* ── CALENDAR ─────────────────────────────────────────────── */}
        {section === 'calendario' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-up">
            <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border/40 flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Calendário</h3>
                  <p className="text-xs text-muted-foreground">{allMonthAppts.length} consulta(s) no mês</p>
                </div>
              </div>
              <div className="flex justify-center p-6">
                <CalendarComponent
                  mode="single" selected={calDate}
                  onSelect={d => { setCalDate(d); if (d) { setCalYear(d.getFullYear()); setCalMonth(d.getMonth() + 1); } }}
                  locale={ptBR}
                  onMonthChange={d => { setCalYear(d.getFullYear()); setCalMonth(d.getMonth() + 1); }}
                  modifiers={{ hasAppts: (date) => apptDates.has(format(date, 'yyyy-MM-dd')) }}
                  modifiersStyles={{ hasAppts: { backgroundColor: 'hsl(262 83% 58%)', color: 'white', fontWeight: 'bold', borderRadius: '8px' } }}
                />
              </div>
            </div>
            <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-border/40 flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {calDate ? format(calDate, "d 'de' MMMM yyyy", { locale: ptBR }) : 'Selecione uma data'}
                  </h3>
                  <p className="text-xs text-muted-foreground">{calDayAppts.length} consulta(s)</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {calDate ? calDayAppts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
                    <Calendar className="w-10 h-10 mb-2" />
                    <p className="text-sm">Nenhuma consulta neste dia</p>
                  </div>
                ) : calDayAppts.map(appt => (
                  <button key={appt.id} onClick={() => { setDetailAppt(appt); setDetailOpen(true); }}
                    className="w-full text-left border border-border/50 rounded-xl p-4 hover:border-primary/35 hover:bg-primary/3 smooth-transition group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-primary tabular-nums">{appt.time}</span>
                      <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{appt.vet_name}</span>
                    </div>
                    <p className="font-medium text-sm text-foreground">{appt.patient_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{appt.patient_pet ?? ''}</p>
                    {appt.patient_notes && (
                      <p className="text-xs text-muted-foreground/60 line-clamp-2 mt-1.5 italic">"{appt.patient_notes}"</p>
                    )}
                  </button>
                )) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
                    <Calendar className="w-10 h-10 mb-2" />
                    <p className="text-sm">Selecione uma data no calendário</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PATIENTS (today) ─────────────────────────────────────── */}
        {section === 'pacientes' && (
          <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 border-b border-border/40 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pacientes de Hoje</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "d 'de' MMMM yyyy", { locale: ptBR })} · {todayAppts.length} paciente(s)
                </p>
              </div>
            </div>
            <div className="p-6">
              {loadingAppts ? (
                <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
              ) : todayAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60">
                  <UserCheck className="w-12 h-12 mb-3" />
                  <p>Nenhum paciente agendado para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppts.sort((a, b) => a.time.localeCompare(b.time)).map(appt => (
                    <button key={appt.id} onClick={() => { setDetailAppt(appt); setDetailOpen(true); }}
                      className="w-full text-left border border-border/50 rounded-xl p-4 hover:border-primary/30 hover:bg-primary/3 smooth-transition group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-primary tabular-nums w-12">{appt.time}</span>
                          <div>
                            <p className="font-medium text-foreground text-sm">{appt.patient_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{appt.patient_pet}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full">
                          <Stethoscope className="inline w-3 h-3 mr-1 -mt-0.5" />{appt.vet_name}
                        </span>
                      </div>
                      {appt.patient_notes && (
                        <p className="text-xs text-muted-foreground/60 italic line-clamp-1 mt-2 pl-16">"{appt.patient_notes}"</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SCHEDULE ─────────────────────────────────────────────── */}
        {section === 'horarios' && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">Horários do Dia</h3>
                <p className="text-xs text-muted-foreground">Consultas ordenadas por horário</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
                  onClick={() => { const d = new Date(scheduleDate + 'T12:00:00'); d.setDate(d.getDate() - 1); setScheduleDate(format(d, 'yyyy-MM-dd')); }}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <input type="date" value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="text-sm border border-border/50 rounded-xl px-3 h-8 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/40 smooth-transition" />
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
                  onClick={() => { const d = new Date(scheduleDate + 'T12:00:00'); d.setDate(d.getDate() + 1); setScheduleDate(format(d, 'yyyy-MM-dd')); }}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {scheduleDate !== todayStr && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg px-3" onClick={() => setScheduleDate(todayStr)}>
                    Hoje
                  </Button>
                )}
              </div>
            </div>

            {loadingAppts ? (
              <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
            ) : scheduleAppts.length === 0 ? (
              <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm flex flex-col items-center justify-center py-20 text-muted-foreground/60">
                <Clock className="w-12 h-12 mb-3" />
                <p className="font-medium">Nenhuma consulta neste dia</p>
              </div>
            ) : (() => {
              const byTime: Record<string, (VetAppointment & { vet_name: string })[]> = {};
              scheduleAppts.sort((a, b) => a.time.localeCompare(b.time))
                .forEach(a => { (byTime[a.time] ??= []).push(a); });
              return Object.entries(byTime).map(([time, appts]) => (
                <div key={time} className="bg-background border border-border/50 rounded-2xl shadow-depth-sm overflow-hidden">
                  <div className="px-5 py-3 bg-primary/5 border-b border-primary/15 flex items-center gap-3">
                    <div className="w-8 h-8 gradient-purple rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-primary tabular-nums">{time}</span>
                    <span className="text-xs text-muted-foreground">{appts.length} consulta{appts.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className={`divide-y divide-border/30 ${appts.length > 1 ? 'grid sm:grid-cols-2' : ''}`}>
                    {appts.map(appt => (
                      <button key={appt.id} onClick={() => { setDetailAppt(appt); setDetailOpen(true); }}
                        className="w-full text-left p-5 hover:bg-muted/30 smooth-transition group">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-4 h-4 text-primary/70" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-primary">{appt.vet_name}</p>
                              <p className="font-semibold text-sm text-foreground">{appt.patient_name ?? '—'}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{appt.patient_pet}</span>
                        </div>
                        {appt.patient_notes ? (
                          <div className="bg-muted/40 border border-border/30 rounded-xl p-3">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Notas do paciente</p>
                            <p className="text-sm text-foreground leading-relaxed line-clamp-3">{appt.patient_notes}</p>
                          </div>
                        ) : (
                          <div className="bg-muted/20 border border-dashed border-border/40 rounded-xl p-3 text-center">
                            <p className="text-xs text-muted-foreground/60">Sem notas</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <AppointmentDetailModal appt={detailAppt} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
};

export default ClinicDashboard;
