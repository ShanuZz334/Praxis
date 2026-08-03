import React from 'react';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import OrderTicket from '@/features/trading/ui/OrderTicket';
import QuickOrderTicket from '@/features/trading/ui/QuickOrderTicket';

export default function GlobalOrderTickets() {
  const { globalOrderTicket, setGlobalOrderTicket } = useDashboardContext();

  if (!globalOrderTicket) return null;

  return (
    <>
      {globalOrderTicket.type === 'FULL' && (
        <OrderTicket 
          instrumentData={globalOrderTicket.data}
          onClose={() => setGlobalOrderTicket(null)}
        />
      )}
      {globalOrderTicket.type === 'QUICK' && (
        <QuickOrderTicket 
          instrumentData={globalOrderTicket.data}
          onClose={() => setGlobalOrderTicket(null)}
        />
      )}
    </>
  );
}
