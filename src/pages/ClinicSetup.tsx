import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Building2, Clock, Stethoscope, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CLINIC_SPECIALTIES, ANIMAL_TYPES } from '@/constants/specialties';
import { clinicSetupSchema } from '@/schemas/clinic.schemas';
import { getClinic, saveClinicSetup } from '@/lib/clinics';
import { lookupCEP } from '@/lib/cep';
import { sanitizeLine } from '@/lib/sanitize';
import {
  fetchVeterinarians, createVeterinarian, deleteVeterinarian,
  type Veterinarian,
} from '@/lib/veterinarians';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const specialties = CLINIC_SPECIALTIES;
const animalTypes = ANIMAL_TYPES;

const ClinicSetup = () => {
  const [formData, setFormData] = useState({
    clinicName: '',
    phone: '',
    cnpj: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    description: '',
    is24Hours: false,
    specialties: [] as string[],
    animalTypes: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  /* Veterinários da clínica (mínimo um para concluir o cadastro). */
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [newVet, setNewVet] = useState({
    name: '', crm: '', work_days: [1, 2, 3, 4, 5] as number[], work_start: '08:00', work_end: '18:00',
  });
  const [savingVet, setSavingVet] = useState(false);

  const handleAddVet = async () => {
    if (!user?.id) return;
    const name = sanitizeLine(newVet.name);
    if (!name || name.length > 120) {
      toast({ title: 'Informe o nome do veterinário', variant: 'destructive' });
      return;
    }
    if (newVet.work_days.length === 0) {
      toast({ title: 'Selecione ao menos um dia de atendimento', variant: 'destructive' });
      return;
    }
    if (newVet.work_start >= newVet.work_end) {
      toast({ title: 'Horário inválido', description: 'O início do expediente deve ser antes do fim.', variant: 'destructive' });
      return;
    }
    setSavingVet(true);
    try {
      const created = await createVeterinarian({
        clinic_id: user.id,
        name,
        crm: sanitizeLine(newVet.crm) || undefined,
        service_type: 'in_person',
        specialties: [],
        work_days: newVet.work_days,
        work_start: newVet.work_start,
        work_end: newVet.work_end,
      });
      setVets(prev => [...prev, created]);
      setNewVet({ name: '', crm: '', work_days: [1, 2, 3, 4, 5], work_start: '08:00', work_end: '18:00' });
      toast({ title: 'Veterinário adicionado', description: created.name });
    } catch (error) {
      toast({
        title: 'Erro ao adicionar veterinário',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSavingVet(false);
    }
  };

  const handleRemoveVet = async (vet: Veterinarian) => {
    try {
      await deleteVeterinarian(vet.id);
      setVets(prev => prev.filter(v => v.id !== vet.id));
    } catch {
      toast({
        title: 'Não foi possível remover',
        description: 'Este veterinário possui consultas vinculadas.',
        variant: 'destructive',
      });
    }
  };

  // Pré-preencher com os dados já salvos da clínica (Req 11.7).
  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    fetchVeterinarians(user.id)
      .then((data) => { if (active) setVets(data); })
      .catch(() => { /* lista vazia */ });

    getClinic(user.id).then((clinic) => {
      if (!active || !clinic) return;
      setFormData((prev) => ({
        ...prev,
        clinicName: clinic.clinic_name ?? prev.clinicName,
        phone: clinic.phone ?? prev.phone,
        cnpj: clinic.cnpj ?? prev.cnpj,
        street: clinic.street ?? prev.street,
        number: clinic.number ?? prev.number,
        neighborhood: clinic.neighborhood ?? prev.neighborhood,
        city: clinic.city ?? prev.city,
        state: clinic.state ?? prev.state,
        cep: clinic.zip_code ?? prev.cep,
        description: clinic.description ?? prev.description,
        is24Hours: clinic.is_24_hours ?? prev.is24Hours,
        specialties: clinic.specialties?.length ? clinic.specialties : prev.specialties,
        animalTypes: clinic.animal_types?.length ? clinic.animal_types : prev.animalTypes,
      }));
    });

    return () => { active = false; };
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Ao digitar um CEP completo (8 dígitos), busca o endereço automaticamente.
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    setFormData((prev) => ({ ...prev, cep }));

    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;

    setCepLoading(true);
    const result = await lookupCEP(digits);
    setCepLoading(false);

    if (result) {
      setFormData((prev) => ({
        ...prev,
        state: result.state || prev.state,
        city: result.city || prev.city,
        street: result.street || prev.street,
        neighborhood: result.neighborhood || prev.neighborhood,
      }));
    } else {
      toast({
        title: "CEP não encontrado",
        description: "Verifique o CEP ou preencha o endereço manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty]
      });
    } else {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter(s => s !== specialty)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    // Validação via schema (CNPJ, allowlists, comprimentos) — Req 11.1/11.2.
    // Strip phone mask before validation (user may type (11) 9999-9999).
    const result = clinicSetupSchema.safeParse({
      ...formData,
      phone: formData.phone.replace(/\D/g, ''),
    });
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast({
        title: "Verifique o formulário",
        description: firstError?.message ?? "Há campos inválidos.",
        variant: "destructive",
      });
      return;
    }

    if (vets.length === 0) {
      toast({
        title: "Cadastre um veterinário",
        description: "Vincule ao menos um veterinário com seus dias e horários de atendimento.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await saveClinicSetup(user.id, result.data);

      toast({
        title: "Sucesso!",
        description: "Perfil da clínica configurado com sucesso.",
      });

      navigate('/clinic-dashboard');
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-purple-light p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              VetFind
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Configurar Perfil da Clínica</h2>
          <p className="text-gray-600">Complete as informações da sua clínica para começar a receber clientes</p>
        </div>

        <Card className="shadow-lg border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-purple-600" />
              <span>Informações da Clínica</span>
            </CardTitle>
            <CardDescription>
              Preencha as informações básicas da sua clínica veterinária
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="text-gray-700">
                    Nome da Clínica *
                  </Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    placeholder="Ex: Clínica Veterinária São Francisco"
                    required
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">
                    Telefone *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    required
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-gray-700">
                    CNPJ *
                  </Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    placeholder="00.000.000/0000-00"
                    required
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-gray-700">
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="border-purple-200 focus:border-purple-400 pr-10"
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Preencha o CEP para completar o endereço automaticamente</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street" className="text-gray-700">
                    Rua / Avenida *
                  </Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Rua das Flores"
                    required
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number" className="text-gray-700">
                    Número *
                  </Label>
                  <Input
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="123"
                    required
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-gray-700">
                  Bairro
                </Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Centro"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-700">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="São Paulo"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-gray-700">
                    Estado
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="SP"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700">
                  Descrição da Clínica
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Conte um pouco sobre sua clínica, serviços oferecidos..."
                  rows={3}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is24Hours"
                  checked={formData.is24Hours}
                  onCheckedChange={(checked) => setFormData({ ...formData, is24Hours: !!checked })}
                />
                <Label htmlFor="is24Hours" className="text-gray-700 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Atendimento 24 horas (para emergências)</span>
                </Label>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700">Tipos de Animais Atendidos * (selecione pelo menos um)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {animalTypes.map((animal) => (
                    <div key={animal.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={animal.value}
                        checked={formData.animalTypes.includes(animal.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, animalTypes: [...formData.animalTypes, animal.value] });
                          } else {
                            setFormData({ ...formData, animalTypes: formData.animalTypes.filter(a => a !== animal.value) });
                          }
                        }}
                      />
                      <Label htmlFor={animal.value} className="text-sm text-gray-700 cursor-pointer">
                        {animal.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700">Especialidades * (selecione pelo menos uma)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialties.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={formData.specialties.includes(specialty)}
                        onCheckedChange={(checked) => handleSpecialtyChange(specialty, !!checked)}
                      />
                      <Label htmlFor={specialty} className="text-sm text-gray-700 cursor-pointer">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Veterinários (obrigatório ao menos um) ───────────── */}
              <div className="space-y-3 pt-4 border-t border-purple-100">
                <Label className="text-gray-700 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-600" />
                  Veterinários da clínica * (cadastre pelo menos um)
                </Label>
                <p className="text-xs text-gray-400">
                  Os dias e horários de atendimento de cada veterinário são usados para validar os agendamentos.
                </p>

                {/* Lista de vets cadastrados */}
                {vets.length > 0 && (
                  <div className="space-y-2">
                    {vets.map(vet => (
                      <div key={vet.id} className="flex items-center justify-between border border-purple-100 bg-purple-50/40 rounded-lg px-4 py-3">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{vet.name}</p>
                          <p className="text-xs text-gray-500">
                            {(vet.work_days ?? []).slice().sort((a, b) => a - b).map(d => DAY_LABELS[d]).join(', ')}
                            {' '}· {vet.work_start}–{vet.work_end}
                            {vet.crm ? ` · CRMV: ${vet.crm}` : ''}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVet(vet)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário de novo vet */}
                <div className="border border-dashed border-purple-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="vetName" className="text-gray-700 text-sm">Nome completo</Label>
                      <Input
                        id="vetName"
                        value={newVet.name}
                        onChange={e => setNewVet(v => ({ ...v, name: e.target.value }))}
                        placeholder="Ex: Dra. Ana Souza"
                        maxLength={120}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vetCrm" className="text-gray-700 text-sm">CRMV (opcional)</Label>
                      <Input
                        id="vetCrm"
                        value={newVet.crm}
                        onChange={e => setNewVet(v => ({ ...v, crm: e.target.value }))}
                        placeholder="SP-12345"
                        maxLength={20}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-700 text-sm">Dias de atendimento</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_LABELS.map((day, idx) => {
                        const active = newVet.work_days.includes(idx);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setNewVet(v => ({
                              ...v,
                              work_days: active ? v.work_days.filter(d => d !== idx) : [...v.work_days, idx],
                            }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              active
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-500 border-purple-200 hover:border-purple-400'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="vetStart" className="text-gray-700 text-sm">Início do expediente</Label>
                      <Input
                        id="vetStart"
                        type="time"
                        value={newVet.work_start}
                        onChange={e => setNewVet(v => ({ ...v, work_start: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vetEnd" className="text-gray-700 text-sm">Fim do expediente</Label>
                      <Input
                        id="vetEnd"
                        type="time"
                        value={newVet.work_end}
                        onChange={e => setNewVet(v => ({ ...v, work_end: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddVet}
                    disabled={savingVet || !newVet.name.trim()}
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {savingVet
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adicionando…</>
                      : <><Plus className="w-4 h-4 mr-2" />Adicionar veterinário</>}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-purple text-white hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Configurar Clínica"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicSetup;