import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceConversation = (initialCallbacks = {}) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isStandbyMode, setIsStandbyMode] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
  
  const statusRef = useRef('idle');
  const standbyRef = useRef(false);
  const voiceModeRef = useRef(false);
  const revertToStandbyRef = useRef(false);
  
  const recognitionRef = useRef(null);
  const callbacksRef = useRef({ 
    onTranscription: initialCallbacks.onTranscription, 
    onTtsStart: initialCallbacks.onTtsStart, 
    onTtsEnd: initialCallbacks.onTtsEnd 
  });
  const isInterruptedRef = useRef(false);
  const finalTranscriptBuffer = useRef("");
  const speechTimeoutRef = useRef(null);

  const updateStatus = useCallback((newStatus) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  }, []);

  const setCallbacks = useCallback((callbacks) => {
    callbacksRef.current = { ...callbacksRef.current, ...callbacks };
  }, []);

  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine'; osc2.type = 'sine';
      osc1.frequency.setValueAtTime(600, ctx.currentTime);
      osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc1.connect(gainNode); osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.15); osc2.stop(ctx.currentTime + 0.3);
      
      // Prevent memory leak by closing the context after playing
      setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close();
      }, 500);
    } catch(e) {
      console.warn("Could not play chime", e);
    }
  }, []);

  const stopTts = useCallback(() => {
    isInterruptedRef.current = true;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const synthesize = useCallback((text) => {
    if (!text) return;
    isInterruptedRef.current = false;
    if (!window.speechSynthesis) return;

    // Immediately lock status and kill mic BEFORE TTS even queues to absolutely prevent echoing
    updateStatus('speaking');
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // stop any ongoing speech
    }

    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    
    const speakNext = (index) => {
        if (index >= sentences.length || isInterruptedRef.current) {
            if (!isInterruptedRef.current) {
                updateStatus('idle');
                if (callbacksRef.current.onTtsEnd) callbacksRef.current.onTtsEnd();
                
                // Resume microphone after speaking if we are still in voice mode or standby
                if (voiceModeRef.current || standbyRef.current) {
                    setTimeout(() => {
                        // Ignore lint warnings about missing dependency; using a ref or stale closure is safer here than a circular dependency
                        startListening();
                    }, 100);
                }
            }
            window.utteranceRef = null;
            return;
        }

        const chunk = sentences[index].trim();
        if (!chunk) {
            speakNext(index + 1);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(chunk);
        window.utteranceRef = utterance; // Save to global to prevent GC bug

        if (index === 0) {
            utterance.onstart = () => {
                if (!isInterruptedRef.current) {
                    if (callbacksRef.current.onTtsStart) callbacksRef.current.onTtsStart();
                }
            };
        }

        utterance.onend = () => {
            speakNext(index + 1);
        };

        // Must be called synchronously to avoid losing user gesture token in Chrome/Safari
        window.speechSynthesis.speak(utterance);
    };

    speakNext(0);
  }, [updateStatus]);

  const toggleStandby = useCallback((val) => {
    setIsStandbyMode(prev => {
      const newVal = val !== undefined ? val : !prev;
      standbyRef.current = newVal;
      if (newVal) {
        setIsVoiceMode(false);
        voiceModeRef.current = false;
        isInterruptedRef.current = false; // Reset interruption state when entering standby
      }
      return newVal;
    });
  }, []);

  const toggleVoiceMode = useCallback((val) => {
    const newState = typeof val === 'boolean' ? val : !voiceModeRef.current;
    setIsVoiceMode(newState);
    voiceModeRef.current = newState;

    if (newState) {
      setIsStandbyMode(false);
      standbyRef.current = false;
      isInterruptedRef.current = false; // Reset interruption state so mic can process input again
    } else {
      // Turn off everything
      setIsStandbyMode(false);
      standbyRef.current = false;
      
      // Force stop TTS and Mic immediately when button is clicked
      isInterruptedRef.current = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      
      if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
      }
      
      // Flush buffers
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      finalTranscriptBuffer.current = "";
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart loop
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    try {
      stopTts();
      stopListening();
      isInterruptedRef.current = false; // MUST BE AFTER stopTts() WHICH SETS IT TO TRUE!

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true; // Use interim results for instant wake word detection
      recognition.lang = 'en-IN'; // Changed to Indian English for better dialect recognition

      recognition.onstart = () => {
        updateStatus('listening');
      };

      recognition.onresult = (event) => {
        // If the AI is currently speaking, aggressively ignore all mic input to prevent echoing
        if (statusRef.current === 'speaking' || isInterruptedRef.current) return;
        
        const lastResult = event.results[event.results.length - 1];
        const text = lastResult[0].transcript.trim();
        const isFinal = lastResult.isFinal;
        
        if (standbyRef.current) {
          const cleanText = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
          
          // Ultra-broad regex: if it contains any of these words, wake up.
          // In standby mode, users typically don't say anything else, so false positives are rare.
          const wakeRegex = /\b(hey|hi|hello|ok|okay)?\s*(pai|pie|pi|bye|pay|pa|p i|api|bhai)\b/i;
          if (wakeRegex.test(cleanText)) {
            console.log("Wake word detected! Waking up...");
            playChime();
            
            // Force reset the transcript buffer so it starts fresh for the question
            try {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
            } catch (err) {
                console.warn("Could not stop recognition:", err);
            }
            
            // Auto switch to active
            setIsVoiceMode(true);
            voiceModeRef.current = true;
            setIsStandbyMode(false);
            standbyRef.current = false;
            revertToStandbyRef.current = true;
            
            // Dispatch event to undock/open the floating UI widget!
            window.dispatchEvent(new CustomEvent('paiGlobalWakeWord', { detail: "" }));
            
            updateStatus('listening');
            
            const payloadText = text.replace(/\b(hey|hi|hello|ok|okay)?\s*(pai|pie|pi|bye|pay|pa|p i|api|bhai)[,\.]?\s*/i, '').trim();
            
            if (payloadText === "") {
              const greetings = ["Hey Shanif.", "Hey Shanu.", "Yes?", "I'm listening.", "How can I help?"];
              const greeting = greetings[Math.floor(Math.random() * greetings.length)];
              setTimeout(() => synthesize(greeting), 400);
            } else if (callbacksRef.current.onTranscription) {
              if (isFinal) {
                callbacksRef.current.onTranscription(payloadText);
              }
            }
          }
        } else {
          // Active mode
          // Strip stray wake words so they aren't sent as standalone chat messages
          const cleanedText = text.replace(/\b(hey|hi|hello|ok|okay)?\s*(pai|pie|pi|bye|pay|pa|p i|api|bhai)\b[,\.]?\s*/gi, '').trim();
          
          if (cleanedText) {
            updateStatus(isFinal ? 'idle' : 'processing');
            
            // Overwrite buffer with the latest interim or final result.
            // Web Speech API usually accumulates the sentence in the interim result.
            finalTranscriptBuffer.current = cleanedText;
            
            // Debounce the send to prevent cutting off the user mid-sentence,
            // and act as a fallback in case isFinal never fires.
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
            
            speechTimeoutRef.current = setTimeout(() => {
              const finalTextToSend = finalTranscriptBuffer.current.trim();
              if (finalTextToSend && callbacksRef.current.onTranscription) {
                callbacksRef.current.onTranscription(finalTextToSend);
              }
              finalTranscriptBuffer.current = ""; // Reset buffer
              updateStatus('idle');
            }, 1800); // Wait 1.8 seconds of silence before assuming they are done speaking
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
            console.warn("Speech recognition error", event.error);
        }
      };

      recognition.onend = () => {
        // Continuous mode stops after a while, auto-restart it if we're still meant to be on
        // but DO NOT restart if the AI is currently speaking
        if ((voiceModeRef.current || standbyRef.current) && statusRef.current !== 'speaking') {
          setTimeout(() => {
            try {
              if (recognitionRef.current === recognition) {
                recognition.start();
              }
            } catch (e) {}
          }, 400); // 400ms delay to prevent CPU-spinning infinite loop if it fails repeatedly
        } else if (statusRef.current !== 'speaking') {
          updateStatus('idle');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

    } catch (err) {
      console.error("Failed to start Web Speech Recognition:", err);
    }
  }, [stopTts, stopListening, updateStatus, playChime, synthesize]);

  const skipTts = useCallback(() => {
    if (statusRef.current === 'speaking') {
      window.speechSynthesis.cancel();
      isInterruptedRef.current = false;
      if (voiceModeRef.current || standbyRef.current) {
        startListening();
      } else {
        updateStatus('idle');
      }
    }
  }, [startListening, updateStatus]);

  useEffect(() => {
    if (isVoiceMode || isStandbyMode) {
      startListening();
    } else {
      stopListening();
      stopTts();
      updateStatus('idle');
    }
    
    return () => {
      stopListening();
      stopTts();
    };
  }, [isVoiceMode, isStandbyMode, startListening, stopListening, stopTts, updateStatus]);

  return {
    isVoiceMode,
    toggleVoiceMode,
    isStandbyMode,
    toggleStandby,
    status,
    synthesize,
    stopTts,
    skipTts,
    setCallbacks
  };
};
