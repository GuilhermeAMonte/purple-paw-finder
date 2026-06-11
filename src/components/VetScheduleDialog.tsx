import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  UserCheck, Plus, ChevronLeft, ChevronRight, ArrowLeft,
  Stethoscope, Clock, Calendar, Check, X, Loader2,
  AlertCircle, User
} from 'lucide-react';
import {
  Veterinarian, VetAppointment,
  DEFAULT_SLOTS, ServiceType,
  fetchVeterinarians, createVeterinarian,
  fetchVetAppointments, bookVetSlot,
  getWeekDateRange,
} from '@/lib/veterinarians';
import { CLINIC_SPECIALTIES } from '@/constants/specialties';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { enUS } from 'date-fns/locale';

/* ── Types ──────────────────────────────────────────────────────────── */
type Step = 'select-vet' | 'register-vet' | 'pick-slot' | 'confirm';
type Week = 1 | 2 | 3 | 4;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clinicId: string;
  patientName: string;
  patientPet: string;
  patientNotes?: string;
  ticketId?: string;
  onBooked?: (appt: VetAppointment & { vet_name: string }) => void;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SERVICE_LABELS: Record<ServiceType, string> = {
  in_person: 'In-person',
  online:    'Online / Telemedicine',
  both:      'Both',
};

function getSlotColor(status: 'available' | 'booked' | 'unavailable' | 'past') {
  switch (status) {
    case 'available':   return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer';
    case 'booked':      return 'bg-primary/8 border-primary/25 text-primary cursor-default';
    case 'unavailable': return 'bg-red-50 border-red-200 text-red-400 line-through cursor-not-allowed opacity-60';
    case 'past':        return 'bg-muted/50 border-border text-muted-foreground/40 cursor-not-allowed opacity-50';
  }
}

/* ── Main component ─────────────────────────────────────────────────── */
const VetScheduleDialog: React.FC<Props> = ({
  open, onOpenChange, clinicId, patientName, patientPet, patientNotes, ticketId, onBooked,
}) => {
  const { toast } = useToast();

  /* Step state */
  const [step, setStep] = useState<Step>('select-vet');

  /* Vet list */
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loadingVets, setLoadingVets] = useState(false);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);

  /* New vet form */
  const [newVet, setNewVet] = useState({
    name: '', crm: '', service_type: 'in_person' as ServiceType, specialties: [] as string[],
  });
  const [savingVet, setSavingVet] = useState(false);

  /* Month/week navigation */
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-based
  const [activeWeek, setActiveWeek] = useState<Week>(1);

  /* Slot data */
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  /* Selected slot */
  const [pickedDate, setPickedDate] = useState('');
  const [pickedTime, setPickedTime] = useState('');

  /* Booking */
  const [booking, setBooking] = useState(false);

  /* ── Load vets when dialog opens ──────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    setStep('select-vet');
    setSelectedVet(null);
    setPickedDate('');
    setPickedTime('');
    loadVets();
  }, [open, clinicId]);

  const loadVets = async () => {
    setLoadingVets(true);
    try {
      const data = await fetchVeterinarians(clinicId);
      setVets(data);
    } catch {
      toast({ title: 'Error loading vets', description: 'Could not load veterinarians.', variant: 'destructive' });
    } finally {
      setLoadingVets(false);
    }
  };

  /* ── Load slots when vet or month changes ─────────────────────────── */
  const loadSlots = useCallback(async () => {
    if (!selectedVet) return;
    setLoadingSlots(true);
    try {
      const data = await fetchVetAppointments(selectedVet.id, viewYear, viewMonth);
      setAppointments(data);
    } catch {
      toast({ title: 'Error loading slots', description: 'Could not load schedule.', variant: 'destructive' });
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedVet, viewYear, viewMonth]);

  useEffect(() => {
    if (step === 'pick-slot') loadSlots();
  }, [step, loadSlots]);

  /* ── Save new vet ─────────────────────────────────────────────────── */
  const handleSaveVet = async () => {
    if (!newVet.name.trim()) {
      toast({ title: 'Required', description: 'Vet name is required.', variant: 'destructive' });
      return;
    }
    setSavingVet(true);
    try {
      const created = await createVeterinarian({ ...newVet, clinic_id: clinicId });
      setVets(prev => [...prev, created]);
      setSelectedVet(created);
      setNewVet({ name: '', crm: '', service_type: 'in_person', specialties: [] });
      setStep('pick-slot');
      toast({ title: 'Vet registered!', description: `${created.name} added to your clinic.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message ?? 'Could not save vet.', variant: 'destructive' });
    } finally {
      setSavingVet(false);
    }
  };

  /* ── Navigate months ──────────────────────────────────────────────── */
  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
    setActiveWeek(1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
    setActiveWeek(1);
  };

  /* ── Resolve slot status for display ─────────────────────────────── */
  const resolveStatus = (date: string, time: string): 'available' | 'booked' | 'unavailable' | 'past' => {
    const slotDatetime = new Date(`${date}T${time}:00`);
    if (slotDatetime < new Date()) return 'past';
    const found = appointments.find(a => a.date === date && a.time === time);
    if (!found) return 'available';
    if (found.status === 'unavailable' || found.status === 'cancelled') return 'unavailable';
    return 'booked';
  };

  const getAppointment = (date: string, time: string) =>
    appointments.find(a => a.date === date && a.time === time);

  /* ── Book the picked slot ─────────────────────────────────────────── */
  const handleBook = async () => {
    if (!selectedVet || !pickedDate || !pickedTime) return;
    setBooking(true);
    try {
      const appt = await bookVetSlot({
        vet_id: selectedVet.id,
        clinic_id: clinicId,
        ticket_id: ticketId,
        date: pickedDate,
        time: pickedTime,
        status: 'booked',
        patient_name: patientName,
        patient_pet: patientPet,
        patient_notes: patientNotes,
      });
      toast({ title: 'Appointment booked!', description: `${patientName} scheduled for ${format(parseISO(pickedDate), 'MMM d')} at ${pickedTime}.` });
      onBooked?.({ ...appt, vet_name: selectedVet.name });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Booking failed', description: e.message ?? 'Slot may already be taken.', variant: 'destructive' });
    } finally {
      setBooking(false);
    }
  };

  /* ── Week view ──────────────────────────────────────────────────────── */
  const weekRange  = getWeekDateRange(viewYear, viewMonth, activeWeek);
  const monthLabel = format(new Date(viewYear, viewMonth - 1, 1), 'MMMM yyyy', { locale: enUS });

  /* ── Render steps ─────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40 flex-shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {(step === 'register-vet' || step === 'pick-slot') && (
                <button
                  onClick={() => setStep(step === 'pick-slot' ? 'select-vet' : 'select-vet')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 smooth-transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <DialogTitle className="text-base font-semibold">
                  {step === 'select-vet'  && 'Select Veterinarian'}
                  {step === 'register-vet'&& 'Register Veterinarian'}
                  {step === 'pick-slot'   && `Schedule — ${selectedVet?.name}`}
                  {step === 'confirm'     && 'Confirm Appointment'}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {patientName} · {patientPet}
                </DialogDescription>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mt-3">
              {(['select-vet', 'pick-slot', 'confirm'] as Step[]).map((s, i) => (
                <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
                  step === s ? 'w-6 bg-primary' :
                  (step === 'pick-slot' && i < 1) || (step === 'confirm' && i < 2) || (step === 'register-vet' && i === 0)
                    ? 'w-3 bg-primary/40' : 'w-3 bg-border'
                }`} />
              ))}
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── STEP: Select vet ──────────────────────────────────────── */}
          {step === 'select-vet' && (
            <div className="space-y-3 animate-fade-in-up">
              {loadingVets ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : vets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                    <Stethoscope className="w-7 h-7 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">No vets registered</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a veterinarian to your clinic to schedule appointments.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vets.map(vet => (
                    <button
                      key={vet.id}
                      onClick={() => { setSelectedVet(vet); setStep('pick-slot'); }}
                      className="text-left border border-border/50 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/3 smooth-transition group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {vet.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{vet.name}</p>
                          {vet.crm && <p className="text-[11px] text-muted-foreground">CRM: {vet.crm}</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] bg-muted/60 text-muted-foreground border border-border/40 rounded-full px-2 py-0.5">
                          {SERVICE_LABELS[vet.service_type]}
                        </span>
                        {vet.specialties.slice(0, 2).map(s => (
                          <span key={s} className="text-[10px] bg-primary/6 text-primary/80 border border-primary/15 rounded-full px-2 py-0.5">
                            {s}
                          </span>
                        ))}
                        {vet.specialties.length > 2 && (
                          <span className="text-[10px] text-muted-foreground px-1">+{vet.specialties.length - 2}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Add new vet */}
              <button
                onClick={() => setStep('register-vet')}
                className="w-full border-2 border-dashed border-border/60 rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary smooth-transition"
              >
                <Plus className="w-4 h-4" />
                Register new veterinarian
              </button>
            </div>
          )}

          {/* ── STEP: Register vet ────────────────────────────────────── */}
          {step === 'register-vet' && (
            <div className="space-y-5 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Full name <span className="text-destructive">*</span></Label>
                  <Input
                    value={newVet.name}
                    onChange={e => setNewVet(v => ({ ...v, name: e.target.value }))}
                    placeholder="Dr. Ana Souza"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CRMV (optional)</Label>
                  <Input
                    value={newVet.crm}
                    onChange={e => setNewVet(v => ({ ...v, crm: e.target.value }))}
                    placeholder="SP-12345"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Service type <span className="text-destructive">*</span></Label>
                  <Select
                    value={newVet.service_type}
                    onValueChange={v => setNewVet(prev => ({ ...prev, service_type: v as ServiceType }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, label]) => (
                        <SelectItem key={k} value={k}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 max-h-52 overflow-y-auto pr-1">
                  {CLINIC_SPECIALTIES.map(spec => (
                    <label key={spec} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={newVet.specialties.includes(spec)}
                        onCheckedChange={checked =>
                          setNewVet(v => ({
                            ...v,
                            specialties: checked
                              ? [...v.specialties, spec]
                              : v.specialties.filter(s => s !== spec),
                          }))
                        }
                      />
                      <span className="text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSaveVet}
                disabled={savingVet || !newVet.name.trim()}
                className="w-full rounded-xl gradient-purple text-white hover:opacity-90 h-11"
              >
                {savingVet ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                {savingVet ? 'Saving…' : 'Register & Continue'}
              </Button>
            </div>
          )}

          {/* ── STEP: Pick slot ───────────────────────────────────────── */}
          {step === 'pick-slot' && (
            <div className="space-y-4 animate-fade-in-up">

              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center hover:bg-muted/60 smooth-transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-foreground capitalize">{monthLabel}</span>
                <button onClick={nextMonth} className="w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center hover:bg-muted/60 smooth-transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Week tabs */}
              <div className="flex gap-1.5 bg-muted/40 rounded-xl p-1">
                {([1, 2, 3, 4] as Week[]).map(w => (
                  <button
                    key={w}
                    onClick={() => setActiveWeek(w)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium smooth-transition ${
                      activeWeek === w
                        ? 'bg-background shadow-sm text-foreground border border-border/40'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Week {w}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300" />Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" />Unavailable</span>
              </div>

              {/* Days + slots grid */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {weekRange.days.map(dateStr => {
                    const dateObj = parseISO(dateStr + 'T00:00:00');
                    const dayName = DAY_NAMES[dateObj.getDay()];
                    const dayNum  = format(dateObj, 'd MMM', { locale: enUS });

                    return (
                      <div key={dateStr} className="border border-border/40 rounded-xl overflow-hidden">
                        {/* Day header */}
                        <div className={`px-4 py-2 flex items-center justify-between ${
                          isToday(dateObj) ? 'bg-primary/8 border-b border-primary/20' : 'bg-muted/30 border-b border-border/30'
                        }`}>
                          <span className="text-sm font-semibold text-foreground">
                            {dayName}, {dayNum}
                          </span>
                          {isToday(dateObj) && (
                            <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-2 py-0.5">Today</span>
                          )}
                        </div>

                        {/* Time slots */}
                        <div className="p-3 grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                          {DEFAULT_SLOTS.map(time => {
                            const status = resolveStatus(dateStr, time);
                            const appt   = getAppointment(dateStr, time);

                            return (
                              <div
                                key={time}
                                title={
                                  appt?.status === 'booked'
                                    ? `${appt.patient_name ?? 'Patient'} — ${appt.patient_pet ?? ''}`
                                    : undefined
                                }
                                onClick={() => {
                                  if (status !== 'available') return;
                                  setPickedDate(dateStr);
                                  setPickedTime(time);
                                  setStep('confirm');
                                }}
                                className={`relative text-center text-[11px] font-medium border rounded-lg py-1.5 px-1 transition-all duration-150 ${getSlotColor(status)}`}
                              >
                                {time}
                                {status === 'booked' && (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border border-background" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Booked appointments summary for this day */}
                        {appointments.filter(a => a.date === dateStr && a.status === 'booked').length > 0 && (
                          <div className="border-t border-border/30 px-4 py-2.5 space-y-1.5 bg-muted/10">
                            {appointments.filter(a => a.date === dateStr && a.status === 'booked').map(a => (
                              <div key={a.id} className="flex items-center gap-2 text-xs">
                                <Clock className="w-3 h-3 text-primary/60 flex-shrink-0" />
                                <span className="font-medium text-primary">{a.time}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-foreground">{a.patient_name ?? 'Patient'}</span>
                                {a.patient_pet && <span className="text-muted-foreground">({a.patient_pet})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Confirm ─────────────────────────────────────────── */}
          {step === 'confirm' && selectedVet && pickedDate && pickedTime && (
            <div className="space-y-5 animate-scale-in">
              {/* Summary card */}
              <div className="bg-gradient-to-br from-primary/5 via-violet-50/50 to-background border border-primary/15 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(parseISO(pickedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy', { locale: enUS })}
                    </p>
                    <p className="text-sm text-primary font-medium">{pickedTime}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-background rounded-xl p-3 border border-border/40">
                    <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">Veterinarian</p>
                    <p className="font-semibold text-foreground">{selectedVet.name}</p>
                    {selectedVet.crm && <p className="text-xs text-muted-foreground mt-0.5">CRMV: {selectedVet.crm}</p>}
                  </div>
                  <div className="bg-background rounded-xl p-3 border border-border/40">
                    <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">Patient</p>
                    <p className="font-semibold text-foreground">{patientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{patientPet}</p>
                  </div>
                </div>

                {patientNotes && (
                  <div className="bg-background rounded-xl p-3 border border-border/40">
                    <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">Patient notes</p>
                    <p className="text-sm text-foreground leading-relaxed">{patientNotes}</p>
                  </div>
                )}

                {selectedVet.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVet.specialties.slice(0, 4).map(s => (
                      <span key={s} className="text-[10px] bg-primary/6 text-primary/80 border border-primary/12 rounded-full px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('pick-slot')}
                  className="flex-1 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change slot
                </Button>
                <Button
                  onClick={handleBook}
                  disabled={booking}
                  className="flex-1 rounded-xl gradient-purple text-white hover:opacity-90 h-11"
                >
                  {booking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {booking ? 'Booking…' : 'Confirm appointment'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VetScheduleDialog;
