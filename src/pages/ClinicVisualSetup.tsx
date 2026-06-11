import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Camera, Clock, Globe, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getClinic, saveClinicVisual, type WeekSchedule } from '@/lib/clinics';

const ClinicVisualSetup = () => {
  const [formData, setFormData] = useState({
    profileImage: '',
    openingHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '12:00', closed: false },
      sunday: { open: '09:00', close: '12:00', closed: true }
    },
    welcomeMessage: '',
    mission: '',
    socialMedia: {
      website: '',
      instagram: '',
      facebook: ''
    },
    additionalInfo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [is24Hours, setIs24Hours] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const timeOptions = [
    '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
    '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
  ];

  // Carrega a flag 24h e horários já salvos da clínica.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    getClinic(user.id).then((clinic) => {
      if (!active || !clinic) return;
      setIs24Hours(clinic.is_24_hours);

      // Pré-preenche horários salvos (formato do banco usa isOpen).
      const saved = clinic.schedules as Record<string, { open: string; close: string; isOpen: boolean }>;
      if (saved && Object.keys(saved).length > 0) {
        setFormData((prev) => {
          const merged = { ...prev.openingHours };
          for (const day of Object.keys(merged)) {
            if (saved[day]) {
              merged[day as keyof typeof merged] = {
                open: saved[day].open,
                close: saved[day].close,
                closed: !saved[day].isOpen,
              };
            }
          }
          return { ...prev, openingHours: merged };
        });
      }
    });

    return () => { active = false; };
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({
          ...prev,
          profileImage: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHourChange = (day: string, type: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [type]: value
        }
      }
    }));
  };

  const handleDayToggle = (day: string, closed: boolean) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          closed
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);

    // Mapeia o formulário (closed) para o formato do banco (isOpen).
    const schedules: WeekSchedule = {};
    for (const [day, h] of Object.entries(formData.openingHours)) {
      schedules[day] = { open: h.open, close: h.close, isOpen: !h.closed };
    }

    try {
      await saveClinicVisual(user.id, schedules, is24Hours);

      toast({
        title: "Sucesso!",
        description: "Configuração visual da clínica salva com sucesso.",
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

  const handleSkip = () => {
    navigate('/clinic-dashboard');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuração Visual da Clínica</h2>
          <p className="text-gray-600">Personalize como sua clínica será apresentada aos clientes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto da Clínica */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-6 h-6 text-purple-600" />
                <span>Foto da Clínica</span>
              </CardTitle>
              <CardDescription>
                Adicione uma foto da fachada ou do interior da sua clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {imagePreview ? (
                    <div className="w-48 h-32 rounded-lg overflow-hidden border-2 border-purple-200">
                      <img 
                        src={imagePreview} 
                        alt="Preview da clínica" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhuma foto selecionada</p>
                      </div>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horários de Funcionamento - só mostra se não for 24h */}
          {!is24Hours && (
            <Card className="shadow-lg border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-6 h-6 text-purple-600" />
                  <span>Horários de Funcionamento</span>
                </CardTitle>
                <CardDescription>
                  Configure os horários de atendimento da sua clínica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daysOfWeek.map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-4">
                      <div className="w-32">
                        <Label className="text-sm font-medium">{label}</Label>
                      </div>
                      <div className="flex items-center space-x-2 flex-1">
                        <Select
                          value={formData.openingHours[key as keyof typeof formData.openingHours].open}
                          onValueChange={(value) => handleHourChange(key, 'open', value)}
                          disabled={formData.openingHours[key as keyof typeof formData.openingHours].closed}
                        >
                          <SelectTrigger className="w-24 border-purple-200 focus:border-purple-400">
                            <SelectValue placeholder="Abertura" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-500">às</span>
                        <Select
                          value={formData.openingHours[key as keyof typeof formData.openingHours].close}
                          onValueChange={(value) => handleHourChange(key, 'close', value)}
                          disabled={formData.openingHours[key as keyof typeof formData.openingHours].closed}
                        >
                          <SelectTrigger className="w-24 border-purple-200 focus:border-purple-400">
                            <SelectValue placeholder="Fechamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant={formData.openingHours[key as keyof typeof formData.openingHours].closed ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDayToggle(key, !formData.openingHours[key as keyof typeof formData.openingHours].closed)}
                          className="ml-2"
                        >
                          {formData.openingHours[key as keyof typeof formData.openingHours].closed ? "Fechado" : "Aberto"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagens e Informações */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-6 h-6 text-purple-600" />
                <span>Informações da Clínica</span>
              </CardTitle>
              <CardDescription>
                Adicione informações que serão exibidas no perfil da sua clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcomeMessage"
                  name="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={handleInputChange}
                  placeholder="Ex: Bem-vindos à nossa clínica! Cuidamos do seu pet com carinho e dedicação."
                  rows={2}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission">Missão da Clínica</Label>
                <Textarea
                  id="mission"
                  name="mission"
                  value={formData.mission}
                  onChange={handleInputChange}
                  placeholder="Ex: Nossa missão é proporcionar o melhor cuidado veterinário com tecnologia moderna e atendimento humanizado."
                  rows={2}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Informações Adicionais</Label>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Ex: Estacionamento próprio, Wi-Fi gratuito, área de espera climatizada..."
                  rows={2}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Redes Sociais */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-6 h-6 text-purple-600" />
                <span>Redes Sociais e Website</span>
              </CardTitle>
              <CardDescription>
                Adicione seus canais de comunicação online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="social.website">Website</Label>
                <Input
                  id="social.website"
                  name="social.website"
                  value={formData.socialMedia.website}
                  onChange={handleInputChange}
                  placeholder="https://www.suaclinica.com.br"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social.instagram">Instagram</Label>
                <Input
                  id="social.instagram"
                  name="social.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleInputChange}
                  placeholder="@suaclinica"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social.facebook">Facebook</Label>
                <Input
                  id="social.facebook"
                  name="social.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleInputChange}
                  placeholder="Clínica Veterinária"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-between space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              Pular por agora
            </Button>
            <Button
              type="submit"
              className="gradient-purple text-white hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Finalizar Configuração"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicVisualSetup;