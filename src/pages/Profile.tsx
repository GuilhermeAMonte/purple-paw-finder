import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Save, ArrowLeft, Plus, Trash2, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BreedSelector from '@/components/BreedSelector';

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

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: localStorage.getItem(`phone_${user?.id}`) || '',
    address: localStorage.getItem(`address_${user?.id}`) || '',
    city: localStorage.getItem(`city_${user?.id}`) || '',
    state: localStorage.getItem(`state_${user?.id}`) || '',
    zipCode: localStorage.getItem(`zipCode_${user?.id}`) || '',
  });
  
  const [pets, setPets] = useState<Pet[]>(
    JSON.parse(localStorage.getItem(`pets_${user?.id}`) || '[]')
  );
  
  const [newPet, setNewPet] = useState<Pet>({
    id: '',
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    color: '',
    notes: ''
  });
  
  const [avatar, setAvatar] = useState<string | null>(
    localStorage.getItem(`avatar_${user?.id}`) || null
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPet(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePetSpeciesChange = (value: string) => {
    setNewPet(prev => ({
      ...prev,
      species: value,
      breed: '' // Reset breed when species changes
    }));
  };

  const handlePetBreedChange = (value: string) => {
    setNewPet(prev => ({
      ...prev,
      breed: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPet = () => {
    if (!newPet.name || !newPet.species) {
      toast({
        title: "Erro",
        description: "Nome e espécie são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const petWithId = {
      ...newPet,
      id: Date.now().toString()
    };

    const updatedPets = [...pets, petWithId];
    setPets(updatedPets);
    localStorage.setItem(`pets_${user?.id}`, JSON.stringify(updatedPets));
    
    setNewPet({
      id: '',
      name: '',
      species: '',
      breed: '',
      age: '',
      weight: '',
      color: '',
      notes: ''
    });
    setShowAddPet(false);

    toast({
      title: "Sucesso",
      description: "Pet adicionado com sucesso!",
    });
  };

  const removePet = (petId: string) => {
    const updatedPets = pets.filter(pet => pet.id !== petId);
    setPets(updatedPets);
    localStorage.setItem(`pets_${user?.id}`, JSON.stringify(updatedPets));
    
    toast({
      title: "Sucesso",
      description: "Pet removido com sucesso!",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar dados do usuário no localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: any) => 
        u.id === user?.id 
          ? { ...u, name: formData.name, email: formData.email }
          : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Atualizar usuário logado
      const updatedUser = {
        id: user!.id,
        name: formData.name,
        email: formData.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Salvar dados extras do perfil
      localStorage.setItem(`phone_${user?.id}`, formData.phone);
      localStorage.setItem(`address_${user?.id}`, formData.address);
      localStorage.setItem(`city_${user?.id}`, formData.city);
      localStorage.setItem(`state_${user?.id}`, formData.state);
      localStorage.setItem(`zipCode_${user?.id}`, formData.zipCode);

      // Salvar avatar
      if (avatar) {
        localStorage.setItem(`avatar_${user?.id}`, avatar);
      }

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });

      // Recarregar a página para atualizar o contexto
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        <Card className="glass-effect border-border/40">
          <CardHeader>
            <CardTitle className="text-xl">Configurações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="pets">Meus Pets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={avatar || undefined} />
                        <AvatarFallback className="text-lg font-semibold">
                          {getInitials(formData.name)}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Clique no ícone da câmera para alterar sua foto
                    </p>
                  </div>

                  {/* Personal Information */}
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          name="city"
                          type="text"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="São Paulo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          name="state"
                          type="text"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="SP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          type="text"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="pets" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Meus Pets</h3>
                  <Button 
                    onClick={() => setShowAddPet(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Pet</span>
                  </Button>
                </div>

                {/* Add New Pet Form */}
                {showAddPet && (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="petName">Nome do Pet</Label>
                            <Input
                              id="petName"
                              name="name"
                              value={newPet.name}
                              onChange={handlePetInputChange}
                              placeholder="Nome do seu pet"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="petSpecies">Espécie</Label>
                            <Select onValueChange={handlePetSpeciesChange} value={newPet.species}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a espécie" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dog">Cachorro</SelectItem>
                                <SelectItem value="cat">Gato</SelectItem>
                                <SelectItem value="bird">Pássaro</SelectItem>
                                <SelectItem value="rabbit">Coelho</SelectItem>
                                <SelectItem value="hamster">Hamster</SelectItem>
                                <SelectItem value="fish">Peixe</SelectItem>
                                <SelectItem value="reptile">Réptil</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="petBreed">Raça</Label>
                            <BreedSelector
                              species={newPet.species}
                              value={newPet.breed}
                              onChange={handlePetBreedChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="petAge">Idade</Label>
                            <Input
                              id="petAge"
                              name="age"
                              value={newPet.age}
                              onChange={handlePetInputChange}
                              placeholder="Ex: 2 anos"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="petWeight">Peso</Label>
                            <Input
                              id="petWeight"
                              name="weight"
                              value={newPet.weight}
                              onChange={handlePetInputChange}
                              placeholder="Ex: 15kg"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="petColor">Cor</Label>
                          <Input
                            id="petColor"
                            name="color"
                            value={newPet.color}
                            onChange={handlePetInputChange}
                            placeholder="Ex: Marrom e branco"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="petNotes">Observações</Label>
                          <Textarea
                            id="petNotes"
                            name="notes"
                            value={newPet.notes}
                            onChange={handlePetInputChange}
                            placeholder="Informações adicionais sobre seu pet (comportamento, alergias, etc.)"
                            rows={3}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button onClick={addPet} className="flex-1">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Pet
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAddPet(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pets List */}
                <div className="grid gap-4">
                  {pets.length === 0 ? (
                    <Card className="border-dashed border-2">
                      <CardContent className="p-8 text-center">
                        <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Você ainda não adicionou nenhum pet. Clique em "Adicionar Pet" para começar.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    pets.map((pet) => (
                      <Card key={pet.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{pet.name}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
                                <span><strong>Espécie:</strong> {pet.species === 'dog' ? 'Cachorro' : pet.species === 'cat' ? 'Gato' : pet.species}</span>
                                {pet.breed && <span><strong>Raça:</strong> {pet.breed}</span>}
                                {pet.age && <span><strong>Idade:</strong> {pet.age}</span>}
                                {pet.weight && <span><strong>Peso:</strong> {pet.weight}</span>}
                                {pet.color && <span><strong>Cor:</strong> {pet.color}</span>}
                              </div>
                              {pet.notes && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  <strong>Observações:</strong> {pet.notes}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePet(pet.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;