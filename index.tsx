import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConversationProvider } from './store/conversation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { demoAutoRestore } from './src/auth/demoAuth';
import { db_seedDemoRestaurants } from './src/demoDb';
import { seedDemoAccounts } from './src/auth/demoSeed';
import { startHydration } from './src/lib/dataHydrator';
import { suspendSync } from './src/lib/dataSync';

// Suspend write-through until hydration finishes — this prevents the local
// fallback seed (random IDs) from being echoed to Neon and duplicating the
// canonical demo data the server already seeded.
suspendSync();
demoAutoRestore();
db_seedDemoRestaurants();    // local fallback in case the API hydrate is offline
seedDemoAccounts();          // 2 demo accounts per role (customer / restaurant / hotel)
startHydration();            // pull canonical data from Neon → localStorage (resumes sync on completion)


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConversationProvider>
        <App />
      </ConversationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
