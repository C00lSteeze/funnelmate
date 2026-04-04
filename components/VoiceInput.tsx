import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = '', disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';
        
        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
              onTranscript(transcript);
          }
          setIsListening(false);
          setErrorMsg(null);
        };

        recog.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          
          if (event.error === 'network') {
            setErrorMsg('No Internet');
          } else if (event.error === 'not-allowed') {
            setErrorMsg('Mic Denied');
          } else if (event.error === 'no-speech') {
            // Ignore no-speech, just reset
          } else {
            setErrorMsg('Error');
          }

          // Clear error after 3s
          setTimeout(() => setErrorMsg(null), 3000);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      } else {
        setIsSupported(false);
      }
    }
  }, [onTranscript]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!isSupported) {
        alert("Voice input is not supported in this browser. Please use Chrome or Safari.");
        return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition", err);
        setIsListening(false);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative inline-flex items-center">
        <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`p-2 rounded-full transition-all duration-200 focus:outline-none flex items-center justify-center relative ${
                isListening 
                ? 'text-red-500 bg-red-100 dark:bg-red-900/30 ring-2 ring-red-400 animate-pulse' 
                : 'text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${className}`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
        >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        
        {/* Error Badge */}
        {errorMsg && (
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-50 animate-in fade-in zoom-in">
                {errorMsg}
            </div>
        )}
    </div>
  );
};

export default VoiceInput;