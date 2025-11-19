import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MyAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const userAppointments = tickets.filter((t: any) => t.userId === user.id);
      setAppointments(userAppointments);
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Recusado</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40 mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Meus Agendamentos
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o status dos seus agendamentos
            </p>
          </div>

          {appointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Você ainda não tem agendamentos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="border-border/40">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(appointment.approvalStatus)}
                        <div>
                          <CardTitle className="text-lg">{appointment.clinicName}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{appointment.service}</p>
                        </div>
                      </div>
                      {getStatusBadge(appointment.approvalStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {new Date(appointment.scheduledDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{appointment.scheduledTime}</span>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium text-sm mb-1">{appointment.title}</p>
                      <p className="text-sm text-gray-600">{appointment.description}</p>
                    </div>

                    {appointment.approvalStatus === 'rejected' && appointment.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-red-900 mb-2">Motivo da recusa:</p>
                        <p className="text-sm text-red-800">{appointment.rejectionReason}</p>
                        <Button
                          onClick={() => navigate(`/chat/chat_${appointment.id}`)}
                          className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Conversar com a clínica
                        </Button>
                      </div>
                    )}

                    {appointment.approvalStatus === 'approved' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-900">
                          ✓ Agendamento confirmado! Compareça no horário marcado.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyAppointments;
