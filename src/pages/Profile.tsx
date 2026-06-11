import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Camera, Save, ArrowLeft, Plus, Trash2, Heart, AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BreedSelector from '@/components/BreedSelector';
import { supabase } from '@/lib/supabase';
import { validateImageFile } from '@/utils/fileValidation';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  color: string;
  notes: string;
}

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Dog', cat: 'Cat', bird: 'Bird', rabbit: 'Rabbit',
  hamster: 'Hamster', fish: 'Fish', reptile: 'Reptile', other: 'Other',
};

const parseWeight = (w: string): number | null => {
  const n = parseFloat(w.replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
};

const Profile = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab   = params.get('tab') || 'personal';
  const initialAddPet = params.get('add') === '1';
  const returnTo     = params.get('returnTo');

  const [activeTab, setActiveTab]   = useState(initialTab);
  const [showAddPet, setShowAddPet] = useState(initialAddPet);
  const [isLoading, setIsLoading]   = useState(false);
  const [loadingPets, setLoadingPets] = useState(true);

  const [formData, setFormData] = useState({
    name:    user?.name  || '',
    email:   user?.email || '',
    phone:   '',
    address: '',
    city:    '',
    state:   '',
    zipCode: '',
  });

  const [pets, setPets] = useState<Pet[]>([]);

  const [newPet, setNewPet] = useState<Pet>({
    id: '', name: '', species: '', breed: '',
    age: '', weight: '', color: '', notes: '',
  });

  const [newPetPhoto, setNewPetPhoto] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  /* ── Load profile from Supabase ─────────────────────────────── */
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('name, phone, address')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFormData(prev => ({
            ...prev,
            name:    data.name    ?? prev.name,
            phone:   data.phone   ?? '',
            address: data.address ?? '',
          }));
        }
      });
  }, [user?.id]);

  /* ── Load pets from Supabase ────────────────────────────────── */
  useEffect(() => {
    if (!user?.id) return;
    setLoadingPets(true);
    supabase
      .from('pets')
      .select('id, name, species, breed, weight')
      .eq('owner_id', user.id)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setPets(data.map((p: any) => ({
            id:      p.id,
            name:    p.name,
            species: p.species,
            breed:   p.breed,
            age:     '',
            weight:  p.weight ? String(p.weight) + 'kg' : '',
            color:   '',
            notes:   '',
          })));
        }
        setLoadingPets(false);
      });
  }, [user?.id]);

  /* ── Add pet to Supabase ────────────────────────────────────── */
  const addPet = async () => {
    if (!newPet.name || !newPet.species || !newPet.breed) {
      toast({ title: 'Campos obrigatórios', description: 'Nome, espécie e raça são obrigatórios.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pets')
        .insert({
          owner_id: user!.id,
          name:     newPet.name,
          species:  newPet.species as any,
          breed:    newPet.breed,
          weight:   parseWeight(newPet.weight),
        })
        .select('id, name, species, breed, weight')
        .single();

      if (error) throw error;

      const saved: Pet = {
        id:      data.id,
        name:    data.name,
        species: data.species,
        breed:   data.breed,
        age:     newPet.age,
        weight:  newPet.weight,
        color:   newPet.color,
        notes:   newPet.notes,
      };

      setPets(prev => [...prev, saved]);
      setNewPet({ id: '', name: '', species: '', breed: '', age: '', weight: '', color: '', notes: '' });
      setNewPetPhoto(null);
      setShowAddPet(false);

      toast({ title: 'Pet adicionado!', description: `${saved.name} foi cadastrado com sucesso.` });

      if (returnTo) navigate(`${returnTo}?selectedPet=${saved.id}`);
    } catch {
      toast({ title: 'Erro ao salvar pet', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Remove pet from Supabase ───────────────────────────────── */
  const removePet = async (petId: string) => {
    try {
      const { error } = await supabase.from('pets').delete().eq('id', petId);
      if (error) throw error;
      setPets(prev => prev.filter(p => p.id !== petId));
      toast({ title: 'Pet removido' });
    } catch {
      toast({ title: 'Erro ao remover pet', variant: 'destructive' });
    }
  };

  /* ── Save profile ───────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUserProfile({
        name:    formData.name,
        phone:   formData.phone,
        address: [formData.address, formData.city, formData.state, formData.zipCode].filter(Boolean).join(', '),
      });
      toast({ title: 'Perfil atualizado!' });
    } catch {
      toast({ title: 'Erro ao salvar perfil', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Avatar ──────────────────────────────────────────────────── */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = await validateImageFile(file);
    if (err) {
      toast({ title: 'Arquivo inválido', description: err, variant: 'destructive' });
      e.target.value = '';
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const path = `${user!.id}/avatar${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Erro ao salvar foto', description: 'Tente novamente.', variant: 'destructive' });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatar(publicUrl);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id);
  };

  const handlePetPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = await validateImageFile(file);
    if (err) {
      toast({ title: 'Arquivo inválido', description: err, variant: 'destructive' });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setNewPetPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );

      if (!res.ok) throw new Error('export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meus-dados-pawconnect.json';
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Dados exportados com sucesso!' });
    } catch {
      toast({ title: 'Erro ao exportar dados', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'delete failed');
      }

      logout();
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro ao excluir conta', description: message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie seus dados e pets</p>
        </div>

        <Card className="border-border/40 shadow-depth-sm mb-4">
          <CardHeader>
            <CardTitle className="text-xl">Configurações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="pets">Meus Pets</TabsTrigger>
              </TabsList>

              {/* ── Personal tab ────────────────────────────────── */}
              <TabsContent value="personal" className="space-y-6 pt-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={avatar || undefined} />
                        <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                          {getInitials(formData.name || user?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 smooth-transition">
                        <Camera className="w-4 h-4" />
                      </label>
                      <input id="avatar-upload" type="file" accept="image/*"
                        onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <p className="text-xs text-muted-foreground">Clique no ícone para alterar a foto</p>
                  </div>

                  {/* Fields */}
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input id="name" value={formData.name}
                          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" value={formData.email} disabled
                          className="bg-muted/40 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" type="tel" value={formData.phone}
                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="(11) 99999-9999" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="address">Endereço</Label>
                      <Input id="address" value={formData.address}
                        onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                        placeholder="Rua, número, complemento" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city">Cidade</Label>
                        <Input id="city" value={formData.city}
                          onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                          placeholder="São Paulo" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="state">Estado</Label>
                        <Input id="state" value={formData.state}
                          onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                          placeholder="SP" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input id="zipCode" value={formData.zipCode}
                          onChange={e => setFormData(p => ({ ...p, zipCode: e.target.value }))}
                          placeholder="00000-000" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full rounded-xl gradient-purple text-white hover:opacity-90">
                    {isLoading ? 'Salvando…' : <><Save className="w-4 h-4 mr-2" />Salvar Alterações</>}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Pets tab ─────────────────────────────────────── */}
              <TabsContent value="pets" className="space-y-5 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Meus Pets</h3>
                  <Button onClick={() => setShowAddPet(true)} size="sm"
                    className="rounded-xl gradient-purple text-white hover:opacity-90">
                    <Plus className="w-4 h-4 mr-1.5" />Adicionar Pet
                  </Button>
                </div>

                {/* Add new pet form */}
                {showAddPet && (
                  <Card className="border-dashed border-2 border-primary/30">
                    <CardContent className="p-4 space-y-4">
                      {/* Pet photo */}
                      <div className="flex flex-col items-center space-y-2">
                        <div className="relative">
                          <Avatar className="w-20 h-20">
                            <AvatarImage src={newPetPhoto || undefined} />
                            <AvatarFallback className="text-2xl">🐾</AvatarFallback>
                          </Avatar>
                          <label htmlFor="pet-photo-upload"
                            className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 cursor-pointer hover:bg-primary/90 smooth-transition">
                            <Camera className="w-3 h-3" />
                          </label>
                          <input id="pet-photo-upload" type="file" accept="image/*"
                            onChange={handlePetPhotoChange} className="hidden" />
                        </div>
                        <p className="text-xs text-muted-foreground">Foto do pet (opcional)</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Nome *</Label>
                          <Input value={newPet.name} placeholder="Nome do pet"
                            onChange={e => setNewPet(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Espécie *</Label>
                          <Select value={newPet.species} onValueChange={v => setNewPet(p => ({ ...p, species: v, breed: '' }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(SPECIES_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Raça *</Label>
                        <BreedSelector
                          species={newPet.species}
                          value={newPet.breed}
                          onChange={v => setNewPet(p => ({ ...p, breed: v }))}
                          disabled={!newPet.species}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label>Idade</Label>
                          <Input value={newPet.age} placeholder="Ex: 2 anos"
                            onChange={e => setNewPet(p => ({ ...p, age: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Peso</Label>
                          <Input value={newPet.weight} placeholder="Ex: 15kg"
                            onChange={e => setNewPet(p => ({ ...p, weight: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Cor</Label>
                          <Input value={newPet.color} placeholder="Ex: Marrom"
                            onChange={e => setNewPet(p => ({ ...p, color: e.target.value }))} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Observações</Label>
                        <Textarea value={newPet.notes} rows={2}
                          placeholder="Alergias, medicamentos, comportamento…"
                          onChange={e => setNewPet(p => ({ ...p, notes: e.target.value }))}
                          className="resize-none" />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={addPet} disabled={isLoading} className="flex-1 rounded-xl gradient-purple text-white hover:opacity-90">
                          <Save className="w-4 h-4 mr-2" />{isLoading ? 'Salvando…' : 'Salvar Pet'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddPet(false)} className="flex-1 rounded-xl">
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pets list */}
                {loadingPets ? (
                  <div className="space-y-3">{[0,1].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
                ) : pets.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-8 text-center">
                      <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-muted-foreground">Nenhum pet cadastrado ainda.</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Clique em "Adicionar Pet" para começar.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pets.map(pet => (
                      <Card key={pet.id} className="border border-border/50 shadow-depth-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-12 h-12 flex-shrink-0">
                                <AvatarFallback className="text-xl bg-primary/10">🐾</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-foreground">{pet.name}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                                  <span>{SPECIES_LABELS[pet.species] ?? pet.species}</span>
                                  {pet.breed && <span>{pet.breed}</span>}
                                  {pet.weight && <span>{pet.weight}</span>}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removePet(pet.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {/* ── Data export ──────────────────────────────────────── */}
        <Card className="border-border/40 shadow-depth-sm mb-4">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Download className="w-5 h-5 text-muted-foreground" />
              Portabilidade de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Exportar meus dados</p>
                <p className="text-sm text-muted-foreground">
                  Baixe uma cópia de todos os seus dados em formato JSON (LGPD Art. 18, V).
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="sm:flex-shrink-0"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exportando…' : 'Baixar dados'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Danger Zone ──────────────────────────────────────── */}
        <Card className="border-destructive/40 shadow-depth-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Excluir conta</p>
                <p className="text-sm text-muted-foreground">
                  Remove permanentemente sua conta e todos os dados associados (LGPD Art. 18, VI).
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="sm:flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Confirmation dialog ───────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Excluir conta permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. Todos os seus dados — perfil, pets, chamados e
              histórico — serão apagados imediatamente e não poderão ser recuperados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo…' : 'Sim, excluir minha conta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
