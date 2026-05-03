import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { ConversationProvider } from './store/conversation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { demoAutoRestore } from './src/auth/demoAuth';
import { db_seedDemoRestaurants } from './src/demoDb';

demoAutoRestore();
db_seedDemoRestaurants(); // ensure all 4 demo restaurants exist in localStorage


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