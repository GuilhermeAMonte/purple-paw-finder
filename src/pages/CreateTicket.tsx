import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, X, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BreedSelector from '@/components/BreedSelector';
import { supabase } from '@/lib/supabase';
import { getClinic } from '@/lib/clinics';
import { createTicket } from '@/lib/tickets';
import { validateReferralFile } from '@/utils/fileValidation';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
}

const AVAILABLE_TIMES = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
];

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', rabbit: 'Coelho',
  hamster: 'Hamster', fish: 'Peixe', reptile: 'Réptil', other: 'Outro',
};

const CreateTicket = () => {
  const { id: clinicId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const isEmergency = new URLSearchParams(location.search).get('emergency') === 'true';

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [clinicName, setClinicName] = useState('Clínica');
  const [clinicServices, setClinicServices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    service: '',
    title: '',
    description: '',
    petName: '',
    petSpecies: '',
    petBreed: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  /* Load clinic */
  useEffect(() => {
    if (!clinicId) return;
    getClinic(clinicId).then(clinic => {
      if (clinic) {
        setClinicName(clinic.clinic_name ?? 'Clínica');
        setClinicServices(clinic.specialties ?? []);
      }
    });
  }, [clinicId]);

  /* Load pets from Supabase */
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('pets')
      .select('id, name, species, breed')
      .eq('owner_id', user.id)
      .then(({ data }) => setPets((data ?? []) as Pet[]));
  }, [user]);

  /* Auto-select pet from query param */
  useEffect(() => {
    const petId = new URLSearchParams(location.search).get('selectedPet');
    if (petId && pets.length > 0) {
      const pet = pets.find(p => p.id === petId);
      if (pet) handlePetSelection(pet.id);
    }
  }, [location.search, pets]);

  /* Emergency mode: auto-fill service, date, time */
  useEffect(() => {
    if (!isEmergency) return;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    // Round up to next 30-min slot
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;
    const roundedHours = minutes < 30 ? now.getHours() : now.getHours() + 1;
    const emergencyTime = `${String(roundedHours % 24).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      service: 'Emergência',
      title: 'Atendimento emergencial',
      scheduledDate: today,
      scheduledTime: AVAILABLE_TIMES.includes(emergencyTime) ? emergencyTime : AVAILABLE_TIMES[0],
    }));
  }, [isEmergency]);

  const handlePetSelection = (petId: string) => {
    if (petId === 'manual') { setSelectedPet(null); return; }
    const pet = pets.find(p => p.id === petId) ?? null;
    setSelectedPet(pet);
    if (pet) {
      setFormData(prev => ({
        ...prev,
        petName: pet.name,
        petSpecies: pet.species,
        petBreed: pet.breed,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service || !formData.title || !formData.description) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos marcados com *.', variant: 'destructive' });
      return;
    }
    if (!formData.scheduledDate || !formData.scheduledTime) {
      toast({ title: 'Data e horário', description: 'Selecione data e horário da consulta.', variant: 'destructive' });
      return;
    }
    const petName = selectedPet?.name ?? formData.petName;
    const petSpecies = selectedPet?.species ?? formData.petSpecies;
    const petBreed  = selectedPet?.breed  ?? formData.petBreed;
    if (!petName || !petSpecies) {
      toast({ title: 'Informações do pet', description: 'Nome e espécie do pet são obrigatórios.', variant: 'destructive' });
      return;
    }
    if (!isEmergency && formData.service !== 'Clínica Geral' && !file) {
      toast({ title: 'Encaminhamento necessário', description: 'Anexe o encaminhamento do clínico geral.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let referralPath: string | null = null;
      if (file) {
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        const path = `${user!.id}/${crypto.randomUUID()}${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('referrals')
          .upload(path, file, { upsert: false });
        if (uploadError) {
          toast({ title: 'Erro no upload', description: 'Não foi possível enviar o encaminhamento.', variant: 'destructive' });
          setSubmitting(false);
          return;
        }
        referralPath = path;
      }

      const ticket = await createTicket({
        user_id: user!.id,
        clinic_id: clinicId!,
        pet_id: selectedPet?.id,
        pet_name: petName,
        pet_species: petSpecies,
        pet_breed: petBreed,
        service: formData.service,
        title: formData.title,
        description: formData.description,
        scheduled_date: formData.scheduledDate,
        scheduled_time: formData.scheduledTime,
        referral_file_url: referralPath,
        is_emergency: isEmergency,
      });

      if (isEmergency) {
        toast({ title: '🚨 Chamado emergencial enviado!', description: 'A clínica será notificada imediatamente.' });
        navigate(`/chat/${ticket.id}?emergency=true`);
      } else {
        toast({ title: 'Chamado enviado!', description: 'Aguarde a aprovação da clínica.' });
        navigate(`/ticket/${ticket.id}/confirmation`, { state: { ticket } });
      }
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível enviar o chamado.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const needsReferral = !isEmergency && formData.service && formData.service !== 'Clínica Geral';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>

          {isEmergency && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-sm">Atendimento Emergencial</p>
                <p className="text-sm mt-0.5 text-red-700">O chamado será enviado como urgência. Informe seu pet e descreva a situação brevemente — a clínica responderá o mais rápido possível.</p>
              </div>
            </div>
          )}

          <div className="bg-card rounded-3xl p-8 border border-border/40 shadow-depth-sm mb-6">
            <h1 className="text-3xl font-semibold text-foreground mb-1">
              {isEmergency ? '🚨 Chamado Emergencial' : 'Abrir Chamado'}
            </h1>
            <p className="text-muted-foreground">Solicite atendimento para {clinicName}</p>
          </div>

          <div className="bg-card rounded-3xl p-8 border border-border/40 shadow-depth-sm">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Pet */}
              <div className="space-y-1.5">
                <Label className="text-base font-medium">Selecionar Pet</Label>
                <Select onValueChange={handlePetSelection}>
                  <SelectTrigger className="h-12 rounded-xl border-border/50">
                    <SelectValue placeholder="Escolha um pet ou preencha manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Preencher manualmente</SelectItem>
                    {pets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name} — {SPECIES_LABELS[pet.species] ?? pet.species}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pets.length === 0 && (
                  <div className="pt-1 space-y-1">
                    <p className="text-sm text-muted-foreground">Nenhum pet cadastrado.</p>
                    <Button type="button" variant="secondary" size="sm"
                      onClick={() => navigate(`/profile?tab=pets&add=1&returnTo=/clinic/${clinicId}/create-ticket`)}>
                      Cadastrar novo pet
                    </Button>
                  </div>
                )}
              </div>

              {/* Tipo de atendimento */}
              {!isEmergency && (
                <div className="space-y-1.5">
                  <Label className="text-base font-medium">Tipo de Atendimento *</Label>
                  <Select value={formData.service} onValueChange={v => setFormData(p => ({ ...p, service: v }))}>
                    <SelectTrigger className="h-12 rounded-xl border-border/50">
                      <SelectValue placeholder="Selecione o tipo de atendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {(clinicServices.length > 0 ? clinicServices : ['Clínica Geral']).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.service && (
                <>
                  {/* Título */}
                  <div className="space-y-1.5">
                    <Label className="text-base font-medium">Título do Caso *</Label>
                    <Input value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      placeholder="Ex: Consulta de rotina — vacinação anual"
                      className="h-12 rounded-xl border-border/50" />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-1.5">
                    <Label className="text-base font-medium">Descrição *</Label>
                    <Textarea value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descreva sintomas, há quanto tempo começou, comportamentos observados…"
                      rows={5} className="rounded-xl border-border/50 resize-none" />
                  </div>

                  {/* Data e horário */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />Agendar Consulta *
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Data</Label>
                        <Input type="date" value={formData.scheduledDate}
                          onChange={e => setFormData(p => ({ ...p, scheduledDate: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-10 rounded-xl border-border/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Horário</Label>
                        <Select value={formData.scheduledTime} onValueChange={v => setFormData(p => ({ ...p, scheduledTime: v }))}>
                          <SelectTrigger className="h-10 rounded-xl border-border/50">
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">A clínica irá revisar e aprovar seu agendamento.</p>
                  </div>

                  {/* Informações do pet (manual) */}
                  {!selectedPet && (
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Informações do Pet *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm">Nome</Label>
                          <Input value={formData.petName}
                            onChange={e => setFormData(p => ({ ...p, petName: e.target.value }))}
                            placeholder="Nome do pet" className="h-10 rounded-xl border-border/50" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm">Espécie</Label>
                          <Select value={formData.petSpecies} onValueChange={v => setFormData(p => ({ ...p, petSpecies: v, petBreed: '' }))}>
                            <SelectTrigger className="h-10 rounded-xl border-border/50">
                              <SelectValue placeholder="Espécie" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SPECIES_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Raça</Label>
                        <BreedSelector
                          species={formData.petSpecies}
                          value={formData.petBreed}
                          onChange={v => setFormData(p => ({ ...p, petBreed: v }))}
                          disabled={!formData.petSpecies}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pet selecionado — resumo */}
                  {selectedPet && (
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                      <Label className="text-sm font-medium block mb-2">Pet selecionado</Label>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-foreground">{selectedPet.name}</span>
                        <span className="text-muted-foreground">{SPECIES_LABELS[selectedPet.species] ?? selectedPet.species}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{selectedPet.breed}</span>
                      </div>
                    </div>
                  )}

                  {/* Encaminhamento */}
                  {needsReferral && (
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Encaminhamento do Clínico Geral *</Label>
                      <p className="text-sm text-muted-foreground">Para atendimentos especializados é necessário o encaminhamento.</p>
                      <div className="border-2 border-dashed border-border/50 rounded-xl p-6">
                        {!file ? (
                          <div className="text-center">
                            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-3">Clique para selecionar ou arraste aqui</p>
                            <input type="file" id="file-upload" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              className="hidden" onChange={async e => {
                                const picked = e.target.files?.[0] ?? null;
                                if (!picked) return;
                                const err = await validateReferralFile(picked);
                                if (err) {
                                  toast({ title: 'Arquivo inválido', description: err, variant: 'destructive' });
                                  e.target.value = '';
                                  return;
                                }
                                setFile(picked);
                              }} />
                            <Label htmlFor="file-upload"
                              className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm cursor-pointer hover:bg-primary/90 smooth-transition">
                              Selecionar Arquivo
                            </Label>
                            <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG, DOC — máx. 10 MB</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}
                              className="text-red-500 hover:text-red-600 h-8 w-8 p-0">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 h-12 rounded-xl">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}
                      className={`flex-1 h-12 rounded-xl text-white hover:opacity-90 ${isEmergency ? 'bg-red-600 hover:bg-red-700' : 'gradient-purple'}`}>
                      {submitting ? 'Enviando…' : isEmergency ? '🚨 Enviar Emergência' : 'Enviar Chamado'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateTicket;
