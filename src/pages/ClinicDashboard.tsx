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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Phone, Users, MessageSquare, Settings, LogOut, Clock, MapPin, Calendar, Send, Edit3, UserCheck, AlertCircle, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppointmentApproval from '@/components/AppointmentApproval';

// Mock data para demonstração
const mockClients = [
  {
    id: 1,
    name: 'Maria Silva',
    pet: 'Rex (Dog)',
    lastContact: '2024-01-15',
    status: 'Awaiting response',
    message: 'I need to schedule an appointment for my dog\'s vaccination.',
    isEmergency: false
  },
  {
    id: 2,
    name: 'João Santos',
    pet: 'Mimi (Cat)',
    lastContact: '2024-01-14',
    status: 'Responded',
    message: 'My cat is behaving strangely, doesn\'t want to eat.',
    isEmergency: false
  },
  {
    id: 3,
    name: 'Ana Costa',
    pet: 'Bolt (Dog)',
    lastContact: '2024-01-13',
    status: 'New',
    message: 'Emergency! My dog was hit by a car.',
    isEmergency: true
  }
];

const specialties = [
  'General Practice', 'Surgery', 'Cardiology', 'Dermatology', 'Ophthalmology',
  'Oncology', 'Orthopedics', 'Neurology', 'Emergency', 'Vaccination',
  'Laboratory Tests', 'Ultrasound', 'Radiology', 'Physiotherapy', 'Veterinary Dentistry'
];

// Mock data para agendamentos
const mockAppointments = [
  {
    id: 1,
    date: '2024-01-15',
    time: '09:00',
    client: 'Maria Silva',
    pet: 'Rex (Dog)',
    doctor: 'Dr. João Santos',
    specialty: 'General Practice',
    status: 'Confirmed'
  },
  {
    id: 2,
    date: '2024-01-15',
    time: '10:30',
    client: 'Ana Costa',
    pet: 'Mimi (Cat)',
    doctor: 'Dr. Carla Lima',
    specialty: 'Vaccination',
    status: 'Confirmed'
  },
  {
    id: 3,
    date: '2024-01-16',
    time: '14:00',
    client: 'Pedro Oliveira',
    pet: 'Bolt (Dog)',
    doctor: 'Dr. João Santos',
    specialty: 'Surgery',
    status: 'Pending'
  },
  {
    id: 4,
    date: '2024-01-16',
    time: '15:30',
    client: 'Lucia Fernandes',
    pet: 'Whiskers (Cat)',
    doctor: 'Dr. Maria Souza',
    specialty: 'Dermatology',
    status: 'Confirmed'
  },
  {
    id: 5,
    date: '2024-01-17',
    time: '08:30',
    client: 'Roberto Silva',
    pet: 'Luna (Dog)',
    doctor: 'Dr. João Santos',
    specialty: 'Laboratory Tests',
    status: 'Confirmed'
  }
];

const ClinicDashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);
  const [currentSection, setCurrentSection] = useState('aprovacoes');
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);

  useEffect(() => {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    setPendingAppointments(tickets.filter((t: any) => t.approvalStatus === 'pending'));
  }, []);

  const handleApproveAppointment = (id: string) => {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const updatedTickets = tickets.map((t: any) => 
      t.id === id ? { ...t, approvalStatus: 'approved', status: 'confirmed' } : t
    );
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    setPendingAppointments(updatedTickets.filter((t: any) => t.approvalStatus === 'pending'));
  };

  const handleRejectAppointment = (id: string, reason: string) => {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const updatedTickets = tickets.map((t: any) => 
      t.id === id ? { ...t, approvalStatus: 'rejected', status: 'rejected', rejectionReason: reason } : t
    );
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    setPendingAppointments(updatedTickets.filter((t: any) => t.approvalStatus === 'pending'));
    
    // Criar chat automático com a mensagem de recusa
    const rejectedTicket = tickets.find((t: any) => t.id === id);
    if (rejectedTicket) {
      const chatId = `chat_${id}`;
      const chatMessages = [
        {
          id: Date.now().toString(),
          text: `Seu agendamento para ${new Date(rejectedTicket.scheduledDate).toLocaleDateString('pt-BR')} às ${rejectedTicket.scheduledTime} foi recusado.\n\nMotivo: ${reason}`,
          sender: 'clinic',
          timestamp: new Date().toISOString(),
          type: 'system'
        }
      ];
      localStorage.setItem(chatId, JSON.stringify(chatMessages));
    }
  };
  const [replyMessage, setReplyMessage] = useState('');
  const [messages, setMessages] = useState<{[key: number]: any[]}>({
    1: [
      {
        id: 1,
        text: 'I need to schedule an appointment for my dog\'s vaccination.',
        timestamp: '2024-01-15 14:30',
        sender: 'client'
      }
    ],
    2: [
      {
        id: 1,
        text: 'My cat is behaving strangely, doesn\'t want to eat.',
        timestamp: '2024-01-14 10:15',
        sender: 'client'
      },
      {
        id: 2,
        text: 'Hello! We can schedule for tomorrow at 3pm. Please bring the vaccination card.',
        timestamp: '2024-01-14 15:45',
        sender: 'clinic'
      }
    ],
    3: [
      {
        id: 1,
        text: 'Emergency! My dog was hit by a car.',
        timestamp: '2024-01-13 09:20',
        sender: 'client'
      }
    ]
  });
  const [hasReplied, setHasReplied] = useState<{[key: number]: boolean}>({});
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    specialty: ''
  });
  const [appointments, setAppointments] = useState(mockAppointments);
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

  // Horários disponíveis
  const availableTimes = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: replyMessage,
      timestamp: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      sender: 'clinic'
    };
    
    const clientId = selectedClient.id;
    const currentMessages = messages[clientId] || [];
    const updatedMessages = [...currentMessages, newMessage];
    
    console.log('Sending message:', newMessage);
    console.log('Updated messages:', updatedMessages);
    
    setMessages({
      ...messages,
      [clientId]: updatedMessages
    });
    
    setReplyMessage('');
  };

  const handleScheduleAppointment = () => {
    if (!scheduleData.date || !scheduleData.time || !scheduleData.specialty) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newAppointment = {
      id: Date.now(),
      date: scheduleData.date,
      time: scheduleData.time,
      client: selectedClient.name,
      pet: selectedClient.pet,
      doctor: 'Dr. João Santos', // Can be selected dynamically
      specialty: scheduleData.specialty,
      status: 'Confirmed'
    };

    setAppointments(prev => [...prev, newAppointment]);
    setIsScheduleDialogOpen(false);
    setScheduleData({ date: '', time: '', specialty: '' });
    
    toast({
      title: "Appointment created",
      description: `Appointment scheduled for ${selectedClient.name} on ${format(new Date(scheduleData.date), "MM/dd/yyyy")} at ${scheduleData.time}.`,
    });
  };

  const getAvailableTimesForDate = (date: string) => {
    const bookedTimes = appointments
      .filter(apt => apt.date === date)
      .map(apt => apt.time);
    return availableTimes.filter(time => !bookedTimes.includes(time));
  };

  const getTodayAppointments = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return appointments.filter(apt => apt.date === today);
  };

  const menuItems = [
    { id: 'aprovacoes', label: 'Pending Approvals', icon: CheckSquare },
    { id: 'contatos', label: 'Contacts', icon: MessageSquare },
    { id: 'emergencias', label: 'Emergencies', icon: AlertCircle },
    { id: 'calendario', label: 'Calendar', icon: Calendar },
    { id: 'pacientes', label: 'Scheduled Patients', icon: UserCheck },
    { id: 'horarios', label: 'Schedule', icon: Clock }
  ];

  const handleProfileUpdate = async () => {
    try {
      await updateUserProfile(profileData);
      setIsProfileDialogOpen(false);
      toast({
        title: "Profile updated",
        description: "Clinic information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error updating profile. Please try again.",
        variant: "destructive",
      });
    }
  };

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
                  Paw Connect
                </h1>
                <p className="text-sm text-gray-600">Clinic Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hello, {user?.name}</span>
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Clinic Profile</DialogTitle>
                    <DialogDescription>
                      Update your clinic information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clinicName">Clinic Name</Label>
                        <Input
                          id="clinicName"
                          value={profileData.clinicName}
                          onChange={(e) => setProfileData({...profileData, clinicName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
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
                      <Label htmlFor="is24Hours">24-hour service</Label>
                    </div>
                    <div>
                      <Label>Specialties</Label>
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
                      Save Changes
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
        {currentSection === 'aprovacoes' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-purple-600" />
                  <span>Agendamentos Pendentes</span>
                </CardTitle>
                <CardDescription>
                  {pendingAppointments.length} agendamento(s) aguardando aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentApproval
                  appointments={pendingAppointments}
                  onApprove={handleApproveAppointment}
                  onReject={handleRejectAppointment}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {currentSection === 'contatos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Clientes */}
            <div className="lg:col-span-1">
              <Card className="h-[calc(100vh-12rem)]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Clients</span>
                  </CardTitle>
                  <CardDescription>
                    Clients who contacted us
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    {mockClients.filter(c => !c.isEmergency).map((client) => (
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
              <Card className="h-[calc(100vh-12rem)]">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <span>Conversation with {selectedClient.name}</span>
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
                <CardContent className="flex flex-col h-[calc(100%-2rem)]">
                  {/* Informações do Cliente */}
                  <div className="bg-gray-50 rounded-lg p-2 mb-2">
                    <h4 className="font-medium text-gray-900 mb-1 text-sm">Client Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-1 font-medium">{selectedClient.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pet:</span>
                        <span className="ml-1 font-medium">{selectedClient.pet}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-1 font-medium">(11) 99999-9999</span>
                      </div>
                      <div>
                        <span className="text-gray-600">E-mail:</span>
                        <span className="ml-1 font-medium">cliente@email.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 space-y-3 overflow-y-auto mb-3 p-3 bg-white rounded-lg border border-gray-200">
                    {messages[selectedClient.id]?.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'clinic' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className="rounded-lg p-3 max-w-xs"
                          style={{
                            backgroundColor: msg.sender === 'clinic' ? '#9333ea' : '#f3f4f6',
                            color: msg.sender === 'clinic' ? '#ffffff' : '#111827'
                          }}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'clinic' ? 'text-purple-200' : 'text-gray-500'
                          }`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your response..."
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
                      Call {selectedClient.name}
                    </Button>
                    <Button 
                      onClick={() => setIsScheduleDialogOpen(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentSection === 'emergencias' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="h-[calc(100vh-12rem)] border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center space-x-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>Emergency Contacts</span>
                  </CardTitle>
                  <CardDescription>
                    Urgent contacts requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    {mockClients.filter(c => c.isEmergency).map((client) => (
                      <div
                        key={client.id}
                        className={`p-4 border-b cursor-pointer hover:bg-red-50 transition-colors border-l-4 border-l-red-500 ${
                          selectedClient.id === client.id ? 'bg-red-50' : ''
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            {client.name}
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </h3>
                          <Badge variant="destructive" className="text-xs">
                            EMERGENCY
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{client.pet}</p>
                        <p className="text-xs text-gray-500">{client.lastContact}</p>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{client.message}</p>
                      </div>
                    ))}
                    {mockClients.filter(c => c.isEmergency).length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No emergency contacts</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-[calc(100vh-12rem)] border-red-200">
                <CardHeader className="bg-red-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <span>Emergency Chat - {selectedClient.name}</span>
                      </CardTitle>
                      <CardDescription>
                        Pet: {selectedClient.pet} • Last contact: {selectedClient.lastContact}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">EMERGENCY</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100%-2rem)]">
                  <div className="bg-red-50 rounded-lg p-2 mb-2 border border-red-200">
                    <h4 className="font-medium text-red-900 mb-1 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Emergency Contact Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-1 font-medium">{selectedClient.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pet:</span>
                        <span className="ml-1 font-medium">{selectedClient.pet}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-1 font-medium">(11) 99999-9999</span>
                      </div>
                      <div>
                        <span className="text-gray-600">E-mail:</span>
                        <span className="ml-1 font-medium">cliente@email.com</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto mb-3 p-3 bg-white rounded-lg border border-red-200">
                    {messages[selectedClient.id]?.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'clinic' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className="rounded-lg p-3 max-w-xs"
                          style={{
                            backgroundColor: msg.sender === 'clinic' ? '#dc2626' : '#fee2e2',
                            color: msg.sender === 'clinic' ? '#ffffff' : '#991b1b'
                          }}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'clinic' ? 'text-red-200' : 'text-red-700'
                          }`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type urgent response..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                        className="flex-1 border-red-300 focus:border-red-500"
                      />
                      <Button onClick={handleSendReply} disabled={!replyMessage.trim()} className="bg-red-600 hover:bg-red-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                      <Phone className="w-4 h-4 mr-2" />
                      Call {selectedClient.name} NOW
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
                  <span>Calendar</span>
                </CardTitle>
                <CardDescription>Select a date to view appointments</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    hasAppointments: (date) => 
                      appointments.some(apt => apt.date === format(date, 'yyyy-MM-dd'))
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
                    Schedule - {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : 'Select a date'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {selectedDate && appointments.filter(apt => apt.date === format(selectedDate, 'yyyy-MM-dd')).length > 0
                    ? `${appointments.filter(apt => apt.date === format(selectedDate, 'yyyy-MM-dd')).length} appointment(s) for this day`
                    : 'No appointments for this day'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {appointments
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
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              Cancel
                            </Button>
                            <Button size="sm" className="text-xs">
                              Confirm
                            </Button>
                          </div>
                        </div>
                      ))
                    }
                    
                    {appointments.filter(apt => apt.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                        <p>No appointments for this day</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                    <p>Select a date on the calendar to view appointments</p>
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
                <span>Today's Scheduled Patients</span>
              </CardTitle>
              <CardDescription>
                {format(new Date(), "MMMM dd, yyyy")} - {getTodayAppointments().length} patient(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getTodayAppointments().length > 0 ? (
                <div className="space-y-4">
                  {getTodayAppointments()
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
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium text-gray-900">{appointment.client}</p>
                            <p className="text-sm text-gray-600">{appointment.pet}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{appointment.doctor}</p>
                            <p className="text-sm text-gray-600">{appointment.specialty}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button size="sm" variant="outline">Cancel</Button>
                          <Button size="sm">Attend</Button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                  <p>No patients scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentSection === 'horarios' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Available Times</span>
              </CardTitle>
              <CardDescription>Available times for scheduling today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {getAvailableTimesForDate(format(new Date(), 'yyyy-MM-dd')).map((time) => (
                  <div
                    key={time}
                    className="p-3 text-center border rounded-lg bg-green-50 border-green-200 text-green-700"
                  >
                    <div className="font-medium">{time}</div>
                    <div className="text-xs mt-1">Available</div>
                  </div>
                ))}
                
                {availableTimes
                  .filter(time => !getAvailableTimesForDate(format(new Date(), 'yyyy-MM-dd')).includes(time))
                  .map((time) => (
                    <div
                      key={time}
                      className="p-3 text-center border rounded-lg bg-red-50 border-red-200 text-red-700"
                    >
                      <div className="font-medium">{time}</div>
                      <div className="text-xs mt-1">Busy</div>
                    </div>
                  ))
                }
              </div>
              
              {getAvailableTimesForDate(format(new Date(), 'yyyy-MM-dd')).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                  <p>All times are busy today</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog para Agendamento */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Appointment</DialogTitle>
              <DialogDescription>
                Schedule appointment for {selectedClient.name} - {selectedClient.pet}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div>
                <Label htmlFor="time">Time</Label>
                <Select value={scheduleData.time} onValueChange={(value) => setScheduleData({...scheduleData, time: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleData.date && getAvailableTimesForDate(scheduleData.date).map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select value={scheduleData.specialty} onValueChange={(value) => setScheduleData({...scheduleData, specialty: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsScheduleDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleScheduleAppointment}
                  className="flex-1"
                >
                  Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClinicDashboard;