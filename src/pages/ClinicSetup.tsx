import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, MapPin, Phone, Building2, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const specialties = [
  'Clínica Geral',
  'Cirurgia',
  'Cardiologia',
  'Dermatologia',
  'Oftalmologia',
  'Oncologia',
  'Ortopedia',
  'Neurologia',
  'Emergência',
  'Vacinação',
  'Exames Laboratoriais',
  'Ultrassonografia',
  'Radiologia',
  'Fisioterapia',
  'Odontologia Veterinária'
];

const ClinicSetup = () => {
  const [formData, setFormData] = useState({
    clinicName: '',
    phone: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    description: '',
    is24Hours: false,
    specialties: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    setIsLoading(true);

    if (!formData.clinicName || !formData.phone || !formData.cnpj || !formData.address) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.specialties.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma especialidade.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await updateUserProfile(formData);
      
      toast({
        title: "Sucesso!",
        description: "Perfil da clínica configurado com sucesso.",
      });
      
      navigate('/clinic-dashboard');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar informações. Tente novamente.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
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
                  <Input
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-700">
                  Endereço Completo *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro"
                  required
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