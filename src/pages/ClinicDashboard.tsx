import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Phone, Users, MessageSquare, Settings, LogOut, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const ClinicDashboard = () => {
  const { user, logout } = useAuth();
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
                  VetFind
                </h1>
                <p className="text-sm text-gray-600">Dashboard da Clínica</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user?.name}</span>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
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
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                  <Button className="flex-1 gradient-purple text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Responder Mensagem
                  </Button>
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;