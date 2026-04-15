
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { ChatMessage, MessageAuthor, RestaurantInfo } from '../types';

const LOCAL_STORAGE_KEY = 'liora_convo_v2';

// 1. Define types
type Intent = "SMALL_TALK" | "NEARBY" | "SHOW_MENU" | "PLAN_MEAL" | "UNKNOWN" | "SHOW_SPECIALS";

interface InternalConversationState {
  histories: Record<string, ChatMessage[]>;
  activeContext: string;
  lastIntent?: Intent;
  lastRestaurant?: RestaurantInfo;
  lastCandidates?: RestaurantInfo[];
  searchQuery?: string;
  prefillData?: any;
}

// 2. Define actions for the reducer
type Action =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_INTENT'; payload: Intent }
  | { type: 'SET_LAST_RESTAURANT'; payload: RestaurantInfo }
  | { type: 'SET_CANDIDATES'; payload: RestaurantInfo[] }
  | { type: 'SET_SEARCH_QUERY', payload: string }
  | { type: 'SET_PREFILL_DATA', payload: any }
  | { type: 'SWITCH_CONTEXT', payload: string }
  | { type: 'CLEAR_CONTEXT', payload: string }
  | { type: 'RESET' };

interface ConversationContextType {
    history: ChatMessage[];
    activeContext: string;
    lastIntent?: Intent;
    lastRestaurant?: RestaurantInfo;
    lastCandidates?: RestaurantInfo[];
    searchQuery?: string;
    prefillData?: any;

    addMessage: (msg: ChatMessage) => void;
    setIntent: (intent: Intent) => void;
    setLastRestaurant: (restaurant: RestaurantInfo) => void;
    setCandidates: (candidates: RestaurantInfo[]) => void;
    setSearchQuery: (query: string) => void;
    setPrefillData: (data: any) => void;
    switchContext: (contextId: string) => void;
    clearContext: (contextId: string) => void;
    reset: () => void;
}

// 3. Create context
const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// 4. Default initial state
const defaultInitialState: InternalConversationState = {
  histories: {
      'main': [{ id: '1', author: MessageAuthor.LIORA, text: "Hello! I'm Liora. How can I light up your table today? Ask me for a recipe, a nearby restaurant, or what to eat based on your mood." }],
  },
  activeContext: 'main',
  lastIntent: undefined,
  lastRestaurant: undefined,
  lastCandidates: undefined,
  searchQuery: '',
  prefillData: null,
};

// 5. Reducer function
const conversationReducer = (state: InternalConversationState, action: Action): InternalConversationState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
       const currentHistory = state.histories[state.activeContext] || [];
       // Prevent duplicates if component re-renders quickly
       if (currentHistory.find(m => m.id === action.payload.id)) {
        return state;
      }
      return {
          ...state,
          histories: {
              ...state.histories,
              [state.activeContext]: [...currentHistory, action.payload]
          }
      };
    case 'SWITCH_CONTEXT':
        return {
            ...state,
            activeContext: action.payload,
            histories: {
                ...state.histories,
                // Ensure the context exists in the dictionary
                [action.payload]: state.histories[action.payload] || []
            }
        };
    case 'CLEAR_CONTEXT':
        // Retrieve default history for this context if it exists in the initial state
        const resetHistory = defaultInitialState.histories[action.payload] || [];
        return {
            ...state,
            histories: {
                ...state.histories,
                [action.payload]: resetHistory
            }
        };
    case 'SET_INTENT':
      return { ...state, lastIntent: action.payload };
    case 'SET_LAST_RESTAURANT':
      return { ...state, lastRestaurant: action.payload };
    case 'SET_CANDIDATES':
      return { ...state, lastCandidates: action.payload };
    case 'SET_SEARCH_QUERY':
        return { ...state, searchQuery: action.payload };
    case 'SET_PREFILL_DATA':
        return { ...state, prefillData: action.payload };
    case 'RESET':
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return defaultInitialState;
    default:
      return state;
  }
};

// 6. Provider component
export const ConversationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const initializer = (initialState: InternalConversationState) => {
    try {
        const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedState) {
            const parsedState = JSON.parse(storedState) as InternalConversationState;
            // Basic validation
            if (parsedState.histories && typeof parsedState.histories === 'object') {
                 return { ...initialState, ...parsedState };
            }
        }
    } catch (e) {
        console.error("Could not load conversation from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return initialState;
  };
    
  const [state, dispatch] = useReducer(conversationReducer, defaultInitialState, initializer);

  useEffect(() => {
    try {
        // Persist state changes
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Could not save conversation to localStorage", e);
    }
  }, [state]);


  const addMessage = useCallback((msg: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', payload: msg }), []);
  const setIntent = useCallback((intent: Intent) => dispatch({ type: 'SET_INTENT', payload: intent }), []);
  const setLastRestaurant = useCallback((restaurant: RestaurantInfo) => dispatch({ type: 'SET_LAST_RESTAURANT', payload: restaurant }), []);
  const setCandidates = useCallback((candidates: RestaurantInfo[]) => dispatch({ type: 'SET_CANDIDATES', payload: candidates }), []);
  const setSearchQuery = useCallback((query: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }), []);
  const setPrefillData = useCallback((data: any) => dispatch({ type: 'SET_PREFILL_DATA', payload: data }), []);
  const switchContext = useCallback((contextId: string) => dispatch({ type: 'SWITCH_CONTEXT', payload: contextId }), []);
  const clearContext = useCallback((contextId: string) => dispatch({ type: 'CLEAR_CONTEXT', payload: contextId }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Derived history for the active context
  const history = state.histories[state.activeContext] || [];

  const value = {
      history,
      activeContext: state.activeContext,
      lastIntent: state.lastIntent,
      lastRestaurant: state.lastRestaurant,
      lastCandidates: state.lastCandidates,
      searchQuery: state.searchQuery,
      prefillData: state.prefillData,
      addMessage,
      setIntent,
      setLastRestaurant,
      setCandidates,
      setSearchQuery,
      setPrefillData,
      switchContext,
      clearContext,
      reset
  };

  return React.createElement(ConversationContext.Provider, { value }, children);
};

// 7. Custom hook
export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
