import React, { useState, useEffect } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
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
  
  const location = useLocation();
  // Lê os parâmetros da URL
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') || 'personal';
  const initialAddPet = params.get('add') === '1';
  const returnTo = params.get('returnTo');

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAddPet, setShowAddPet] = useState(initialAddPet);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: localStorage.getItem(`phone_${user?.id}`) || '',
    address: localStorage.getItem(`rua_${user?.id}`) ? 
      `${localStorage.getItem(`rua_${user?.id}`)}, ${localStorage.getItem(`numero_${user?.id}`)}` : 
      localStorage.getItem(`address_${user?.id}`) || '',
    city: localStorage.getItem(`cidade_${user?.id}`) || localStorage.getItem(`city_${user?.id}`) || '',
    state: localStorage.getItem(`estado_${user?.id}`) || localStorage.getItem(`state_${user?.id}`) || '',
    zipCode: localStorage.getItem(`cep_${user?.id}`) || localStorage.getItem(`zipCode_${user?.id}`) || '',
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
  
  const [newPetPhoto, setNewPetPhoto] = useState<string | null>(null);
  
  const [avatar, setAvatar] = useState<string | null>(
    localStorage.getItem(`avatar_${user?.id}`) || null
  );
  
  const [isLoading, setIsLoading] = useState(false);

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

  const handlePetPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be at most 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewPetPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image must be at most 5MB",
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
    if (!newPet.name || !newPet.species || !newPet.breed) {
      toast({
        title: "Error",
        description: "Name, species and breed are required",
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
    
    // Save pet photo if exists
    if (newPetPhoto) {
      localStorage.setItem(`pet_photo_${petWithId.id}`, newPetPhoto);
    }

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
    setNewPetPhoto(null);
    setShowAddPet(false);

    toast({
      title: "Success",
      description: "Pet added successfully!",
    });

    // Se veio do fluxo de create-ticket, redireciona de volta com o pet selecionado
    if (returnTo) {
      navigate(`${returnTo}?selectedPet=${petWithId.id}`);
    }
  };

  const removePet = (petId: string) => {
    const updatedPets = pets.filter(pet => pet.id !== petId);
    setPets(updatedPets);
    localStorage.setItem(`pets_${user?.id}`, JSON.stringify(updatedPets));
    
    toast({
      title: "Success",
      description: "Pet removed successfully!",
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
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Recarregar a página para atualizar o contexto
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error updating profile. Please try again.",
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
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>

        <Card className="glass-effect border-border/40">
          <CardHeader>
            <CardTitle className="text-xl">Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Data</TabsTrigger>
                <TabsTrigger value="pets">My Pets</TabsTrigger>
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
                      Click the camera icon to change your photo
                    </p>
                  </div>

                  {/* Personal Information */}
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
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
                      <Label htmlFor="phone">Phone</Label>
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
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street, number, complement"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
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
                        <Label htmlFor="state">State</Label>
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
                      "Saving..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="pets" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">My Pets</h3>
                  <Button 
                    onClick={() => setShowAddPet(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Pet</span>
                  </Button>
                </div>

                {/* Add New Pet Form */}
                {showAddPet && (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-4">
                      <div className="grid gap-4">
                        {/* Pet Photo Section */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <Avatar className="w-20 h-20">
                              <AvatarImage src={newPetPhoto || undefined} />
                              <AvatarFallback className="text-lg font-semibold">
                                🐾
                              </AvatarFallback>
                            </Avatar>
                            <label
                              htmlFor="pet-photo-upload"
                              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                            >
                              <Camera className="w-3 h-3" />
                            </label>
                            <input
                              id="pet-photo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handlePetPhotoChange}
                              className="hidden"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Click to add pet photo
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="petName">Pet Name *</Label>
                            <Input
                              id="petName"
                              name="name"
                              value={newPet.name}
                              onChange={handlePetInputChange}
                              placeholder="Your pet's name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="petSpecies">Species *</Label>
                            <Select onValueChange={handlePetSpeciesChange} value={newPet.species}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select species" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dog">Dog</SelectItem>
                                <SelectItem value="cat">Cat</SelectItem>
                                <SelectItem value="bird">Bird</SelectItem>
                                <SelectItem value="rabbit">Rabbit</SelectItem>
                                <SelectItem value="hamster">Hamster</SelectItem>
                                <SelectItem value="fish">Fish</SelectItem>
                                <SelectItem value="reptile">Reptile</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="petBreed">Breed *</Label>
                          <BreedSelector
                            species={newPet.species}
                            value={newPet.breed}
                            onChange={handlePetBreedChange}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="petAge">Age</Label>
                            <Input
                              id="petAge"
                              name="age"
                              value={newPet.age}
                              onChange={handlePetInputChange}
                              placeholder="Ex: 2 years"
                            />
                          </div>
                          {(newPet.species === 'dog' || newPet.species === 'cat') && (
                            <div className="space-y-2">
                              <Label htmlFor="petWeight">Weight</Label>
                              <Input
                                id="petWeight"
                                name="weight"
                                value={newPet.weight}
                                onChange={handlePetInputChange}
                                placeholder="Ex: 15kg"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="petColor">Color</Label>
                          <Input
                            id="petColor"
                            name="color"
                            value={newPet.color}
                            onChange={handlePetInputChange}
                            placeholder="Ex: Brown and white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="petNotes">Notes</Label>
                          <Textarea
                            id="petNotes"
                            name="notes"
                            value={newPet.notes}
                            onChange={handlePetInputChange}
                            placeholder="Additional information about your pet (behavior, allergies, etc.)"
                            rows={3}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button onClick={addPet} className="flex-1">
                            <Save className="w-4 h-4 mr-2" />
                            Save Pet
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAddPet(false)}
                            className="flex-1"
                          >
                            Cancel
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
                          You haven't added any pets yet. Click "Add Pet" to get started.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    pets.map((pet) => (
                      <Card key={pet.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-3 flex-1">
                              <Avatar className="w-12 h-12 flex-shrink-0">
                                <AvatarImage src={localStorage.getItem(`pet_photo_${pet.id}`) || undefined} />
                                <AvatarFallback className="text-sm">
                                  🐾
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{pet.name}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
                                <span><strong>Species:</strong> {pet.species === 'dog' ? 'Dog' : pet.species === 'cat' ? 'Cat' : pet.species}</span>
                                {pet.breed && <span><strong>Breed:</strong> {pet.breed}</span>}
                                {pet.age && <span><strong>Age:</strong> {pet.age}</span>}
                                {pet.weight && <span><strong>Weight:</strong> {pet.weight}</span>}
                                {pet.color && <span><strong>Color:</strong> {pet.color}</span>}
                              </div>
                                {pet.notes && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    <strong>Notes:</strong> {pet.notes}
                                  </p>
                                )}
                              </div>
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