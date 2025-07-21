import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Heart, Phone, Users, MessageSquare, Settings, LogOut, Clock, MapPin, Calendar, Send, Edit3, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data para demonstração
const mockClients = [
  {
    id: 1,
    name: 'Maria Silva',
    pet: 'Rex (Cão)',
    lastContact: '2024-01-15',
    status: 'Aguardando resposta',
    message: 'Preciso agendar uma consulta para vacinação do meu cachorro.'
  },
  {
    id: 2,
    name: 'João Santos',
    pet: 'Mimi (Gato)',
    lastContact: '2024-01-14',
    status: 'Respondido',
    message: 'Minha gata está com comportamento estranho, não quer comer.'
  },
  {
    id: 3,
    name: 'Ana Costa',
    pet: 'Bolt (Cão)',
    lastContact: '2024-01-13',
    status: 'Novo',
    message: 'Emergência! Meu cachorro foi atropelado.'
  }
];

const specialties = [
  'Clínica Geral', 'Cirurgia', 'Cardiologia', 'Dermatologia', 'Oftalmologia',
  'Oncologia', 'Ortopedia', 'Neurologia', 'Emergência', 'Vacinação',
  'Exames Laboratoriais', 'Ultrassonografia', 'Radiologia', 'Fisioterapia', 'Odontologia Veterinária'
];

// Mock data para agendamentos
const mockAppointments = [
  {
    id: 1,
    date: '2024-01-15',
    time: '09:00',
    client: 'Maria Silva',
    pet: 'Rex (Cão)',
    doctor: 'Dr. João Santos',
    specialty: 'Clínica Geral',
    status: 'Confirmado'
  },
  {
    id: 2,
    date: '2024-01-15',
    time: '10:30',
    client: 'Ana Costa',
    pet: 'Mimi (Gato)',
    doctor: 'Dra. Carla Lima',
    specialty: 'Vacinação',
    status: 'Confirmado'
  },
  {
    id: 3,
    date: '2024-01-16',
    time: '14:00',
    client: 'Pedro Oliveira',
    pet: 'Bolt (Cão)',
    doctor: 'Dr. João Santos',
    specialty: 'Cirurgia',
    status: 'Pendente'
  },
  {
    id: 4,
    date: '2024-01-16',
    time: '15:30',
    client: 'Lucia Fernandes',
    pet: 'Whiskers (Gato)',
    doctor: 'Dra. Maria Souza',
    specialty: 'Dermatologia',
    status: 'Confirmado'
  },
  {
    id: 5,
    date: '2024-01-17',
    time: '08:30',
    client: 'Roberto Silva',
    pet: 'Luna (Cão)',
    doctor: 'Dr. João Santos',
    specialty: 'Exames Laboratoriais',
    status: 'Confirmado'
  }
];

const ClinicDashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);
  const [currentSection, setCurrentSection] = useState('contatos');
  const [replyMessage, setReplyMessage] = useState('');
  const [messages, setMessages] = useState<{[key: number]: any[]}>({});
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [profileData, setProfileData] = useState({
    clinicName: (user as any)?.clinicName || '',
    phone: (user as any)?.phone || '',
    cnpj: (user as any)?.cnpj || '',
    address: (user as any)?.address || '',
    city: (user as any)?.city || '',
    state: (user as any)?.state || '',
    cep: (user as any)?.cep || '',
    description: (user as any)?.description || '',
    is24Hours: (user as any)?.is24Hours || false,
    specialties: (user as any)?.specialties || []
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: replyMessage,
      timestamp: new Date().toLocaleString(),
      sender: 'clinic'
    };
    
    setMessages(prev => ({
      ...prev,
      [selectedClient.id]: [...(prev[selectedClient.id] || []), newMessage]
    }));
    
    setReplyMessage('');
    toast({
      title: "Mensagem enviada",
      description: "Sua resposta foi enviada com sucesso.",
    });
  };

  const handleProfileUpdate = async () => {
    try {
      await updateUserProfile(profileData);
      setIsProfileDialogOpen(false);
      toast({
        title: "Perfil atualizado",
        description: "As informações da clínica foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { id: 'contatos', label: 'Contatos', icon: MessageSquare },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'pacientes', label: 'Pacientes Agendados', icon: UserCheck },
    { id: 'horarios', label: 'Horários', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-purple-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-purple rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                  VetFind
                </h1>
                <p className="text-sm text-gray-600">Dashboard da Clínica</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user?.name}</span>
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Perfil da Clínica</DialogTitle>
                    <DialogDescription>
                      Atualize as informações da sua clínica
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clinicName">Nome da Clínica</Label>
                        <Input
                          id="clinicName"
                          value={profileData.clinicName}
                          onChange={(e) => setProfileData({...profileData, clinicName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={profileData.description}
                        onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is24Hours"
                        checked={profileData.is24Hours}
                        onCheckedChange={(checked) => setProfileData({...profileData, is24Hours: !!checked})}
                      />
                      <Label htmlFor="is24Hours">Atendimento 24 horas</Label>
                    </div>
                    <div>
                      <Label>Especialidades</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {specialties.map((specialty) => (
                          <div key={specialty} className="flex items-center space-x-2">
                            <Checkbox
                              id={specialty}
                              checked={profileData.specialties.includes(specialty)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProfileData({
                                    ...profileData,
                                    specialties: [...profileData.specialties, specialty]
                                  });
                                } else {
                                  setProfileData({
                                    ...profileData,
                                    specialties: profileData.specialties.filter(s => s !== specialty)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleProfileUpdate} className="w-full">
                      Salvar Alterações
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Menu */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-purple-100">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    currentSection === item.id 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content based on selected section */}
        {currentSection === 'contatos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
            {/* Lista de Clientes */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Clientes</span>
                  </CardTitle>
                  <CardDescription>
                    Clientes que entraram em contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0 max-h-[calc(100vh-16rem)] overflow-y-auto">
                    {mockClients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedClient.id === client.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{client.name}</h3>
                          <Badge 
                            variant={client.status === 'Novo' ? 'destructive' : 
                                    client.status === 'Aguardando resposta' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {client.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{client.pet}</p>
                        <p className="text-xs text-gray-500">{client.lastContact}</p>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{client.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhes do Cliente */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <span>Conversa com {selectedClient.name}</span>
                      </CardTitle>
                      <CardDescription>
                        Pet: {selectedClient.pet} • Último contato: {selectedClient.lastContact}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={selectedClient.status === 'Novo' ? 'destructive' : 
                              selectedClient.status === 'Aguardando resposta' ? 'default' : 'secondary'}
                    >
                      {selectedClient.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100vh-20rem)]">
                  {/* Informações do Cliente */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Informações do Cliente</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Nome:</span>
                        <span className="ml-2 font-medium">{selectedClient.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pet:</span>
                        <span className="ml-2 font-medium">{selectedClient.pet}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Telefone:</span>
                        <span className="ml-2 font-medium">(11) 99999-9999</span>
                      </div>
                      <div>
                        <span className="text-gray-600">E-mail:</span>
                        <span className="ml-2 font-medium">cliente@email.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                    <div className="flex">
                      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                        <p className="text-sm">{selectedClient.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedClient.lastContact} 14:30</p>
                      </div>
                    </div>
                    
                    {selectedClient.status === 'Respondido' && (
                      <div className="flex justify-end">
                        <div className="bg-purple-500 text-white rounded-lg p-3 max-w-xs">
                          <p className="text-sm">Olá! Podemos agendar para amanhã às 15h. Traga a carteirinha de vacinação.</p>
                          <p className="text-xs text-purple-200 mt-1">{selectedClient.lastContact} 15:45</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Mensagens adicionais */}
                    {messages[selectedClient.id]?.map((msg) => (
                      <div key={msg.id} className="flex justify-end">
                        <div className="bg-purple-500 text-white rounded-lg p-3 max-w-xs">
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs text-purple-200 mt-1">{msg.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input */}
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Digite sua resposta..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar para {selectedClient.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentSection === 'calendario' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Calendário</span>
                </CardTitle>
                <CardDescription>Selecione uma data para ver os agendamentos</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="rounded-md border"
                  modifiers={{
                    hasAppointments: (date) => 
                      mockAppointments.some(apt => apt.date === format(date, 'yyyy-MM-dd'))
                  }}
                  modifiersStyles={{
                    hasAppointments: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Agenda do Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>
                    Agenda - {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {selectedDate && mockAppointments.filter(apt => apt.date === format(selectedDate, 'yyyy-MM-dd')).length > 0
                    ? `${mockAppointments.filter(apt => apt.date === format(selectedDate, 'yyyy-MM-dd')).length} agendamento(s) para este dia`
                    : 'Nenhum agendamento para este dia'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {mockAppointments
                      .filter(apt => apt.date === format(selectedDate, 'yyyy-MM-dd'))
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="text-lg font-bold text-purple-600">
                                {appointment.time}
                              </div>
                              <Badge 
                                variant={appointment.status === 'Confirmado' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{appointment.client}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Heart className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{appointment.pet}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <UserCheck className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{appointment.doctor}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{appointment.specialty}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-3">
                            <Button size="sm" variant="outline" className="text-xs">
                              Editar
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              Cancelar
                            </Button>
                            <Button size="sm" className="text-xs">
                              Confirmar
                            </Button>
                          </div>
                        </div>
                      ))
                    }
                    
                    {mockAppointments.filter(apt => apt.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                        <p>Nenhum agendamento para este dia</p>
                        <Button variant="outline" className="mt-4">
                          Criar Agendamento
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                    <p>Selecione uma data no calendário para ver os agendamentos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentSection === 'pacientes' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <span>Pacientes Agendados</span>
              </CardTitle>
              <CardDescription>Veja os pacientes com consultas marcadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                <p>Lista de pacientes agendados em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSection === 'horarios' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Horários</span>
              </CardTitle>
              <CardDescription>Configure seus horários de atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                <p>Configuração de horários em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClinicDashboard;