import React, { useEffect } from 'react';
import RoleRouter from './src/RoleRouter';
import { SubscriptionProvider } from './src/hooks/useSubscription';
import { SettingsProvider } from './src/context/SettingsContext';
import { Toaster } from './src/components/Toaster';
import PwaPrompts from './src/components/PwaPrompts';
import { registerServiceWorker } from './src/lib/pwa';

const App: React.FC = () => {
  useEffect(() => { registerServiceWorker(); }, []);
  return (
    <SettingsProvider>
      <SubscriptionProvider>
        <div className="min-h-screen flex flex-col bg-app text-stone-800">
          <div className="flex-grow">
            <RoleRouter />
          </div>
        </div>
        <Toaster />
        <PwaPrompts />
      </SubscriptionProvider>
    </SettingsProvider>
  );
};

export default App;
