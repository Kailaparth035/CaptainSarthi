import React, {createContext, useContext, useState, useRef, ReactNode} from 'react';
import Tts from 'react-native-tts';
import {useLanguage} from './LanguageContext';

type TTSState = {
  isPlaying: boolean;
  text: string;
  progress: number; // 0-100
  duration: number; // in seconds
  currentPosition: number; // in seconds
};

type TTSContextType = {
  playTTS: (text: string) => Promise<void>;
  stopTTS: () => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  state: TTSState;
};

const TTSContext = createContext<TTSContextType | undefined>(undefined);

const defaultState: TTSState = {
  isPlaying: false,
  text: '',
  progress: 0,
  duration: 0,
  currentPosition: 0,
};

export function TTSProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<TTSState>(defaultState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedPositionRef = useRef<number>(0);
  const {currentLanguage} = useLanguage();

  // Map app language codes to TTS language codes
  const getTTSLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'en': 'en-IN', // Indian English
      'hi': 'hi-IN', // Hindi
      'gu': 'gu-IN', // Gujarati
    };
    return languageMap[lang] || 'en-IN';
  };

  React.useEffect(() => {
    // Initialize TTS with default settings
    const ttsLanguage = getTTSLanguage(currentLanguage);
    Tts.setDefaultLanguage(ttsLanguage);
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);

    // Set up event listeners
    Tts.addEventListener('tts-start', () => {
      setState(prev => ({...prev, isPlaying: true}));
      startTimeRef.current = Date.now();
    });

    Tts.addEventListener('tts-finish', () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        progress: 100,
        currentPosition: prev.duration,
      }));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });

    Tts.addEventListener('tts-cancel', () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        progress: 0,
        currentPosition: 0,
      }));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });

    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Tts.stop();
    };
  }, [currentLanguage]);

  const playTTS = React.useCallback(async (text: string) => {
    try {
      // Stop any existing playback
      await Tts.stop();
      
      // Reset state
      setState({
        isPlaying: false,
        text,
        progress: 0,
        duration: 0,
        currentPosition: 0,
      });

      // Set language based on current language before speaking
      // This is crucial for Android 12+ to work properly with non-English languages
      const ttsLanguage = getTTSLanguage(currentLanguage);
      try {
        await Tts.setDefaultLanguage(ttsLanguage);
      } catch (langError) {
        console.warn('TTS Language setting error, using default:', langError);
      }

      // Estimate duration (rough calculation: ~150 words per minute)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60; // in seconds
      
      setState(prev => ({
        ...prev,
        duration: estimatedDuration,
      }));

      // Start TTS (language is already set via setDefaultLanguage above)
      await Tts.speak(text);

      // Update progress periodically
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.isPlaying || prev.duration === 0) {
            return prev;
          }

          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const currentPos = pausedPositionRef.current + elapsed;
          const progress = Math.min((currentPos / prev.duration) * 100, 100);

          return {
            ...prev,
            currentPosition: currentPos,
            progress,
          };
        });
      }, 100); // Update every 100ms
    } catch (error) {
      console.error('TTS Error:', error);
      setState(prev => ({...prev, isPlaying: false}));
    }
  }, [currentLanguage]);

  const stopTTS = React.useCallback(async () => {
    try {
      await Tts.stop();
      setState(prev => ({
        ...prev,
        isPlaying: false,
        progress: 0,
        currentPosition: 0,
      }));
      pausedPositionRef.current = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('TTS Stop Error:', error);
    }
  }, []);

  const pauseTTS = React.useCallback(async () => {
    try {
      await Tts.stop();
      setState(prev => {
        pausedPositionRef.current = prev.currentPosition;
        return {
          ...prev,
          isPlaying: false,
        };
      });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('TTS Pause Error:', error);
    }
  }, []);

  const resumeTTS = React.useCallback(async () => {
    try {
      const remainingText = state.text;
      const currentPos = pausedPositionRef.current;
      
      // Set language based on current language before speaking
      const ttsLanguage = getTTSLanguage(currentLanguage);
      try {
        await Tts.setDefaultLanguage(ttsLanguage);
      } catch (langError) {
        console.warn('TTS Language setting error, using default:', langError);
      }
      
      // Calculate remaining text (rough approximation)
      const wordsPerSecond = 150 / 60; // words per second
      const wordsToSkip = Math.floor(currentPos * wordsPerSecond);
      const words = remainingText.split(/\s+/);
      const remainingWords = words.slice(wordsToSkip).join(' ');

      if (remainingWords.trim()) {
        startTimeRef.current = Date.now() - pausedPositionRef.current * 1000;
        // Language is already set via setDefaultLanguage above
        await Tts.speak(remainingWords);
      }
    } catch (error) {
      console.error('TTS Resume Error:', error);
    }
  }, [state.text, currentLanguage]);

  return (
    <TTSContext.Provider
      value={{
        playTTS,
        stopTTS,
        pauseTTS,
        resumeTTS,
        state,
      }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within TTSProvider');
  }
  return context;
}

