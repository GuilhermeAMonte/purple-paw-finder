import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';


interface Ticket {
  id: string;
  clinicName: string;
  service: string;
  title: string;
  createdAt: string;
}

const TicketsList = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('tickets');
    if (stored) {
      setTickets(JSON.parse(stored));
    }
  }, []);

  if (tickets.length === 0) {
    return <p className="text-muted-foreground text-center">No open tickets.</p>;
  }

  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <div key={ticket.id} className="bg-card rounded-xl p-4 border border-border/30 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold text-lg text-foreground">{ticket.title}</div>
            <div className="text-sm text-muted-foreground">{ticket.clinicName} • {ticket.service}</div>
            <div className="text-xs text-muted-foreground mt-1">Opened on {ticket.createdAt}</div>
          </div>
          <Button className="mt-2 md:mt-0" onClick={() => navigate(`/chat/${ticket.id}`)}>
            Open chat
          </Button>
        </div>
      ))}
    </div>
  );
};

export default TicketsList;
