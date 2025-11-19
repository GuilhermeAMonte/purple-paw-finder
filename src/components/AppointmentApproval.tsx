import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, User, Heart, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppointmentApprovalProps {
  appointments: any[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const AppointmentApproval: React.FC<AppointmentApprovalProps> = ({ appointments, onApprove, onReject }) => {
  const { toast } = useToast();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = (appointment: any) => {
    onApprove(appointment.id);
    toast({
      title: "Agendamento aprovado",
      description: `Consulta de ${appointment.userName} confirmada.`,
    });
  };

  const handleRejectClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, explique o motivo da recusa.",
        variant: "destructive",
      });
      return;
    }

    onReject(selectedAppointment.id, rejectionReason);
    setRejectDialogOpen(false);
    setRejectionReason('');
    setSelectedAppointment(null);
    
    toast({
      title: "Agendamento recusado",
      description: "Uma mensagem foi enviada ao cliente.",
    });
  };

  const pendingAppointments = appointments.filter(a => a.approvalStatus === 'pending');

  if (pendingAppointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nenhum agendamento pendente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pendingAppointments.map((appointment) => (
          <Card key={appointment.id} className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    {appointment.userName}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{appointment.service}</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  Pendente
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{new Date(appointment.scheduledDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{appointment.scheduledTime}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">Pet: {appointment.petInfo.name}</span>
                </div>
                <p className="text-sm text-gray-600">{appointment.title}</p>
                <p className="text-sm text-gray-500 mt-1">{appointment.description}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(appointment)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  onClick={() => handleRejectClick(appointment)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Agendamento</DialogTitle>
            <DialogDescription>
              Explique o motivo da recusa e sugira datas alternativas para o cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: O horário solicitado já está ocupado. Temos disponibilidade nos seguintes horários: 10:00, 14:00 ou 16:00."
              rows={5}
              className="resize-none"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleRejectConfirm} className="flex-1 bg-red-600 hover:bg-red-700">
                Confirmar Recusa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentApproval;
