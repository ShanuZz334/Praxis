import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useVoiceConversation } from '@/shared/hooks/useVoiceConversation';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const voiceState = useVoiceConversation();
  
  // We keep a mutable ref to the active listener callback
  const activeListenerRef = useRef(null);

  useEffect(() => {
    voiceState.setCallbacks({
      onTranscription: (text) => {
        if (activeListenerRef.current) {
          activeListenerRef.current(text);
        } else {
          // If no active chat is listening, dispatch a global event
          // The PaiFloatingWidget can listen for this to auto-undock!
          window.dispatchEvent(new CustomEvent('paiGlobalWakeWord', { detail: text }));
        }
      },
      onTtsStart: () => window.dispatchEvent(new CustomEvent('paiTtsStart')),
      onTtsEnd: () => window.dispatchEvent(new CustomEvent('paiTtsEnd'))
    });
  }, [voiceState]);
  useEffect(() => {
    const handleRequestTts = (e) => {
      if (e.detail) {
        voiceState.synthesize(e.detail);
      }
    };
    
    window.addEventListener('requestTts', handleRequestTts);
    return () => window.removeEventListener('requestTts', handleRequestTts);
  }, [voiceState]);
  // Provide a function for chat components to register themselves
  const registerListener = (callback) => {
    activeListenerRef.current = callback;
  };

  const unregisterListener = (callback) => {
    if (activeListenerRef.current === callback) {
      activeListenerRef.current = null;
    }
  };

  return (
    <VoiceContext.Provider value={{ ...voiceState, registerListener, unregisterListener }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
