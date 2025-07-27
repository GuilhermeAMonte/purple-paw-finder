export function getTickets() {
  return JSON.parse(localStorage.getItem('tickets') || '[]');
}

export function saveTicket(ticket) {
  const tickets = getTickets();
  tickets.push(ticket);
  localStorage.setItem('tickets', JSON.stringify(tickets));
}
