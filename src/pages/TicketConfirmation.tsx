import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2, MessageSquare, Calendar, Clock,
  PawPrint, Stethoscope, ArrowRight, ListChecks,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Ticket } from '@/lib/tickets';
import Header from '@/components/Header';

const APPROVAL_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Aguardando aprovação', color: 'text-amber-600' },
  approved: { label: 'Aprovado',             color: 'text-emerald-600' },
  rejected: { label: 'Recusado',             color: 'text-red-600' },
};

const TicketConfirmation = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { state } = useLocation() as { state?: { ticket?: Ticket } };
  const ticket = state?.ticket;

  const statusInfo = APPROVAL_STATUS[ticket?.approval_status ?? 'pending'];

  const formattedDate = ticket?.scheduled_date
    ? format(parseISO(ticket.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-lg mx-auto px-5">

          {/* Success header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Chamado enviado!</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Seu chamado foi registrado com sucesso.<br />
              A clínica irá analisá-lo e confirmar o atendimento em breve.
            </p>
          </div>

          {/* Ticket details card */}
          {ticket && (
            <Card className="border-border/40 shadow-depth-sm mb-6">
              <CardContent className="p-5 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
                  <span className={`text-sm font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="border-t border-border/30" />

                {/* Pet */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pet</p>
                    <p className="text-sm font-medium text-foreground">{ticket.pet_name}</p>
                  </div>
                </div>

                {/* Service */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Serviço</p>
                    <p className="text-sm font-medium text-foreground">{ticket.service}</p>
                  </div>
                </div>

                {/* Clinic */}
                {ticket.clinic_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ListChecks className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Clínica</p>
                      <p className="text-sm font-medium text-foreground">{ticket.clinic_name}</p>
                    </div>
                  </div>
                )}

                {/* Date & time */}
                {formattedDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data solicitada</p>
                      <p className="text-sm font-medium text-foreground capitalize">{formattedDate}</p>
                    </div>
                  </div>
                )}

                {ticket.scheduled_time && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horário solicitado</p>
                      <p className="text-sm font-medium text-foreground">{ticket.scheduled_time}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60"
              onClick={() => navigate(`/chat/${ticketId}`)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversar com a clínica
            </Button>

            <Button
              className="w-full h-12 rounded-xl gradient-purple text-white hover:opacity-90"
              onClick={() => navigate('/my-appointments')}
            >
              Ver meus atendimentos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default TicketConfirmation;
