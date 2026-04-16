
import React, { createContext, useContext, useState, ReactNode } from 'react';

import { connectToTable, TableSession, Order, AssistanceRequest } from '../../services/aiWaiterService';

export interface DiningState {
  isActive: boolean;
  restaurantId: string | null;
  restaurantName: string | null;
  tableNumber: string | null;
  sessionId: string | null;
  status: 'browsing' | 'checked-in' | 'ordering' | 'payment';
  orders: Order[];
  assistanceRequests: AssistanceRequest[];
}

interface DiningContextType {
  session: DiningState;
  startSession: (restaurantId: string, name: string) => void;
  connectTableViaQR: (tableNumber: string | number, restaurantName: string) => Promise<void>;
  endSession: () => void;
  addOrder: (order: Order) => void;
  addAssistanceRequest: (request: AssistanceRequest) => void;
  updateOrders: (orders: Order[]) => void;
  updateAssistanceRequests: (requests: AssistanceRequest[]) => void;
}

const DiningContext = createContext<DiningContextType | undefined>(undefined);

// FIX: Explicitly type DiningProvider as React.FC<{ children: ReactNode }> to ensure children are recognized as a required prop by TypeScript.
export const DiningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<DiningState>({
    isActive: false,
    restaurantId: null,
    restaurantName: null,
    tableNumber: null,
    sessionId: null,
    status: 'browsing',
    orders: [],
    assistanceRequests: []
  });

  const startSession = (restaurantId: string, name: string) => {
    setSession({
      isActive: true,
      restaurantId,
      restaurantName: name,
      tableNumber: '12', // Mock table number for demo
      sessionId: null,
      status: 'checked-in',
      orders: [],
      assistanceRequests: []
    });
  };

  const connectTableViaQR = async (tableNumber: string | number, restaurantName: string) => {
    try {
      console.log('📈 Starting table connection...');

      // Attempt connection directly — connectToTable handles network errors itself
      const tableSession = await connectToTable(tableNumber, restaurantName);
      console.log('â … Session created:', tableSession);

      setSession(prev => ({
        ...prev,
        isActive: true,
        restaurantId: restaurantName,
        restaurantName,
        tableNumber: String(tableNumber),
        sessionId: tableSession.sessionId,
        status: 'checked-in'
      }));
    } catch (error) {
      console.error('â Œ Connection error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to table';
      throw new Error(errorMsg);
    }
  };

  const endSession = () => {
    setSession({
      isActive: false,
      restaurantId: null,
      restaurantName: null,
      tableNumber: null,
      sessionId: null,
      status: 'browsing',
      orders: [],
      assistanceRequests: []
    });
  };

  const addOrder = (order: Order) => {
    setSession(prev => ({
      ...prev,
      orders: [...prev.orders, order]
    }));
  };

  const addAssistanceRequest = (request: AssistanceRequest) => {
    setSession(prev => ({
      ...prev,
      assistanceRequests: [...prev.assistanceRequests, request]
    }));
  };

  const updateOrders = (orders: Order[]) => {
    setSession(prev => ({ ...prev, orders }));
  };

  const updateAssistanceRequests = (requests: AssistanceRequest[]) => {
    setSession(prev => ({ ...prev, assistanceRequests: requests }));
  };

  return (
    <DiningContext.Provider value={{
      session,
      startSession,
      connectTableViaQR,
      endSession,
      addOrder,
      addAssistanceRequest,
      updateOrders,
      updateAssistanceRequests
    }}>
      {children}
    </DiningContext.Provider>
  );
};

export const useDining = () => {
  const context = useContext(DiningContext);
  if (!context) throw new Error('useDining must be used within a DiningProvider');
  return context;
};
