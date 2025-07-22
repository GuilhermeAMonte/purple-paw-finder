import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
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
import { breedsBySpecies } from '@/data/breeds';

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

const CreateTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  
  const [formData, setFormData] = useState({
    service: '',
    title: '',
    description: '',
    petName: '',
    petSpecies: '',
    petBreed: '',
    petAge: '',
    petWeight: '',
    petColor: '',
    petNotes: '',
    ownerName: user?.name || '',
    ownerPhone: localStorage.getItem(`phone_${user?.id}`) || '',
    ownerEmail: user?.email || '',
    ownerAddress: localStorage.getItem(`address_${user?.id}`) || ''
  });
  
  const [file, setFile] = useState<File | null>(null);

  // Mock data da clínica
  const clinic = {
    name: "Clínica Veterinária Pet Care",
    services: ["Clínica Geral", "Cirurgia", "Dermatologia", "Radiologia", "Cardiologia"]
  };

  // Carregar pets do usuário
  useEffect(() => {
    if (user?.id) {
      const userPets = JSON.parse(localStorage.getItem(`pets_${user.id}`) || '[]');
      setPets(userPets);
    }
  }, [user]);

  // Pré-preencher dados quando um pet é selecionado
  const handlePetSelection = (petId: string) => {
    if (petId === "manual") {
      setSelectedPet(null);
      setFormData(prev => ({
        ...prev,
        petName: '',
        petSpecies: '',
        petBreed: '',
        petAge: '',
        petWeight: '',
        petColor: '',
        petNotes: ''
      }));
      return;
    }
    
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setFormData(prev => ({
        ...prev,
        petName: pet.name,
        petSpecies: pet.species === 'dog' ? 'Cachorro' : pet.species === 'cat' ? 'Gato' : pet.species,
        petBreed: pet.breed,
        petAge: pet.age,
        petWeight: pet.weight,
        petColor: pet.color,
        petNotes: pet.notes
      }));
    } else {
      setSelectedPet(null);
      setFormData(prev => ({
        ...prev,
        petName: '',
        petSpecies: '',
        petBreed: '',
        petAge: '',
        petWeight: '',
        petColor: '',
        petNotes: ''
      }));
    }
  };

  // Função para converter peso para kg
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let weight = e.target.value;
    // Remove caracteres não numéricos exceto vírgula e ponto
    weight = weight.replace(/[^\d.,]/g, '');
    
    // Se contém apenas números, adiciona kg automaticamente
    if (weight && !weight.includes('kg') && !weight.includes('g')) {
      const numericValue = parseFloat(weight.replace(',', '.'));
      if (!isNaN(numericValue)) {
        weight = numericValue + 'kg';
      }
    }
    
    setFormData(prev => ({
      ...prev,
      petWeight: weight
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service || !formData.title || !formData.description) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar se há informações do pet
    if (!formData.petName || !formData.petSpecies) {
      toast({
        title: "Erro",
        description: "Informações do pet são obrigatórias",
        variant: "destructive",
      });
      return;
    }

    // Validar se há informações do proprietário
    if (!formData.ownerName || !formData.ownerPhone || !formData.ownerEmail) {
      toast({
        title: "Erro",
        description: "Informações do proprietário são obrigatórias",
        variant: "destructive",
      });
      return;
    }

    if (formData.service !== "Clínica Geral" && !file) {
      toast({
        title: "Erro", 
        description: "Para serviços especializados é necessário anexar o encaminhamento do clínico geral.",
        variant: "destructive",
      });
      return;
    }

    // Gerar ID único para o ticket
    const ticketId = Date.now().toString();

    // Aqui seria feita a requisição para a API
    toast({
      title: "Chamado criado com sucesso!",
      description: "Sua solicitação foi enviada para a clínica veterinária.",
    });

    // Redirecionar para o chat
    navigate(`/chat/${ticketId}`);
  };

  const needsReferral = formData.service && formData.service !== "Clínica Geral";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40">
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Abrir Chamado
              </h1>
              <p className="text-muted-foreground">
                Solicite atendimento para {clinic.name}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Pet */}
              <div>
                <Label htmlFor="pet-select" className="text-base font-medium text-foreground mb-3 block">
                  Selecionar Pet
                </Label>
                <Select onValueChange={handlePetSelection}>
                  <SelectTrigger className="h-12 rounded-xl border-border/50">
                    <SelectValue placeholder="Escolha um pet ou preencha manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Preencher manualmente</SelectItem>
                    {pets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name} - {pet.species === 'dog' ? 'Cachorro' : pet.species === 'cat' ? 'Gato' : pet.species}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pets.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nenhum pet cadastrado. Você pode adicionar pets em seu perfil ou preencher manualmente.
                  </p>
                )}
              </div>

              {/* Tipo de Atendimento */}
              <div>
                <Label htmlFor="service" className="text-base font-medium text-foreground mb-3 block">
                  Tipo de Atendimento *
                </Label>
                <Select value={formData.service} onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}>
                  <SelectTrigger className="h-12 rounded-xl border-border/50">
                    <SelectValue placeholder="Selecione o tipo de atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinic.services.map((service, index) => (
                      <SelectItem key={index} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Formulário aparece só após seleção do serviço */}
              {formData.service && (
                <>
                  {/* Título */}
                  <div>
                    <Label htmlFor="title" className="text-base font-medium text-foreground mb-3 block">
                      Título do Caso *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Escreva aqui um título para o problema"
                      className="h-12 rounded-xl border-border/50"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="description" className="text-base font-medium text-foreground mb-3 block">
                      Descrição *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Descreva detalhadamente o que o animal está sentindo, sintomas observados, há quanto tempo começou, etc."
                      rows={6}
                      className="rounded-xl border-border/50 resize-none"
                    />
                  </div>

                  {/* Informações do Pet */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium text-foreground">
                      Informações do Pet *
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="petName" className="text-sm font-medium text-foreground mb-2 block">
                          Nome do Pet
                        </Label>
                        <Input
                          id="petName"
                          name="petName"
                          value={formData.petName}
                          onChange={handleInputChange}
                          placeholder="Nome do seu pet"
                          className="h-10 rounded-xl border-border/50"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="petSpecies" className="text-sm font-medium text-foreground mb-2 block">
                          Espécie
                        </Label>
                        <Select value={formData.petSpecies} onValueChange={(value) => setFormData(prev => ({ ...prev, petSpecies: value, petBreed: '' }))}>
                          <SelectTrigger className="h-10 rounded-xl border-border/50">
                            <SelectValue placeholder="Selecione a espécie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cachorro">Cachorro</SelectItem>
                            <SelectItem value="Gato">Gato</SelectItem>
                            <SelectItem value="Pássaro">Pássaro</SelectItem>
                            <SelectItem value="Coelho">Coelho</SelectItem>
                            <SelectItem value="Hamster">Hamster</SelectItem>
                            <SelectItem value="Peixe">Peixe</SelectItem>
                            <SelectItem value="Réptil">Réptil</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="petBreed" className="text-sm font-medium text-foreground mb-2 block">
                           Raça
                         </Label>
                         <BreedSelector
                           species={formData.petSpecies === 'Cachorro' ? 'dog' : formData.petSpecies === 'Gato' ? 'cat' : formData.petSpecies.toLowerCase()}
                           value={formData.petBreed}
                           onChange={(value) => setFormData(prev => ({ ...prev, petBreed: value }))}
                           disabled={!formData.petSpecies}
                         />
                       </div>
                      <div>
                        <Label htmlFor="petAge" className="text-sm font-medium text-foreground mb-2 block">
                          Idade
                        </Label>
                        <Input
                          id="petAge"
                          name="petAge"
                          value={formData.petAge}
                          onChange={handleInputChange}
                          placeholder="Ex: 2 anos"
                          className="h-10 rounded-xl border-border/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="petWeight" className="text-sm font-medium text-foreground mb-2 block">
                          Peso
                        </Label>
                         <Input
                           id="petWeight"
                           name="petWeight"
                           value={formData.petWeight}
                           onChange={handleWeightChange}
                           placeholder="Ex: 15"
                           className="h-10 rounded-xl border-border/50"
                         />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="petColor" className="text-sm font-medium text-foreground mb-2 block">
                        Cor
                      </Label>
                      <Input
                        id="petColor"
                        name="petColor"
                        value={formData.petColor}
                        onChange={handleInputChange}
                        placeholder="Ex: Marrom e branco"
                        className="h-10 rounded-xl border-border/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="petNotes" className="text-sm font-medium text-foreground mb-2 block">
                        Observações sobre o Pet
                      </Label>
                      <Textarea
                        id="petNotes"
                        name="petNotes"
                        value={formData.petNotes}
                        onChange={handleInputChange}
                        placeholder="Comportamento, alergias, medicamentos em uso, etc."
                        rows={3}
                        className="rounded-xl border-border/50 resize-none"
                      />
                    </div>
                  </div>

                  {/* Informações do Proprietário */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium text-foreground">
                      Informações do Proprietário *
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ownerName" className="text-sm font-medium text-foreground mb-2 block">
                          Nome Completo
                        </Label>
                        <Input
                          id="ownerName"
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleInputChange}
                          placeholder="Seu nome completo"
                          className="h-10 rounded-xl border-border/50"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="ownerPhone" className="text-sm font-medium text-foreground mb-2 block">
                          Telefone
                        </Label>
                        <Input
                          id="ownerPhone"
                          name="ownerPhone"
                          value={formData.ownerPhone}
                          onChange={handleInputChange}
                          placeholder="(11) 99999-9999"
                          className="h-10 rounded-xl border-border/50"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ownerEmail" className="text-sm font-medium text-foreground mb-2 block">
                          Email
                        </Label>
                        <Input
                          id="ownerEmail"
                          name="ownerEmail"
                          type="email"
                          value={formData.ownerEmail}
                          onChange={handleInputChange}
                          placeholder="seu@email.com"
                          className="h-10 rounded-xl border-border/50"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="ownerAddress" className="text-sm font-medium text-foreground mb-2 block">
                          Endereço
                        </Label>
                        <Input
                          id="ownerAddress"
                          name="ownerAddress"
                          value={formData.ownerAddress}
                          onChange={handleInputChange}
                          placeholder="Rua, número, bairro"
                          className="h-10 rounded-xl border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload de arquivo para serviços especializados */}
                  {needsReferral && (
                    <div>
                      <Label className="text-base font-medium text-foreground mb-3 block">
                        Encaminhamento do Clínico Geral *
                      </Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Para atendimentos especializados é necessário anexar o documento de encaminhamento do clínico geral.
                      </p>
                      
                      <div className="border-2 border-dashed border-border/50 rounded-xl p-6">
                        {!file ? (
                          <div className="text-center">
                            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">
                              Clique para selecionar ou arraste o arquivo aqui
                            </p>
                            <input
                              type="file"
                              onChange={handleFileChange}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              className="hidden"
                              id="file-upload"
                            />
                            <Label
                              htmlFor="file-upload"
                              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 cursor-pointer smooth-transition"
                            >
                              Selecionar Arquivo
                            </Label>
                            <p className="text-xs text-muted-foreground mt-2">
                              Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                            <div>
                              <p className="font-medium text-foreground">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="flex-1 h-12 rounded-xl border-border/50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 rounded-xl"
                    >
                      Enviar Chamado
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