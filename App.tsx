import React from 'react';
import RoleRouter from './src/RoleRouter';
import { SubscriptionProvider } from './src/hooks/useSubscription';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-800">
      <div className="flex-grow">
        <SubscriptionProvider>
            <RoleRouter />
        </SubscriptionProvider>
      </div>
    </div>
  );
};

export default App;
