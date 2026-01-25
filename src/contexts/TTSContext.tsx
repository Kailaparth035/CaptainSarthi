import React, {createContext, useContext, useState, useRef, ReactNode} from 'react';
import Tts from 'react-native-tts';
import {Platform} from 'react-native';
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
  const ttsReadyRef = useRef<boolean>(false);
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

  // Initialize TTS engine - critical for Android 11+
  const initializeTTS = React.useCallback(async () => {
    try {
      // Stop any existing playback
      await Tts.stop();
      
      // Set default settings
      const ttsLanguage = getTTSLanguage(currentLanguage);
      
      // For Android 11+, we need to set language and wait for it to be ready
      if (Platform.OS === 'android') {
        try {
          // Set language first
          await Tts.setDefaultLanguage(ttsLanguage);
          // Small delay to ensure language is set (Android 11+ requirement)
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (langError) {
          console.warn('TTS Language setting error:', langError);
        }
      } else {
        await Tts.setDefaultLanguage(ttsLanguage);
      }
      
      // Set rate and pitch
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
      
      // Mark TTS as ready
      ttsReadyRef.current = true;
    } catch (error) {
      console.error('TTS Initialization Error:', error);
      ttsReadyRef.current = false;
    }
  }, [currentLanguage]);

  React.useEffect(() => {
    // Initialize TTS on mount and when language changes
    initializeTTS();

    // Set up event listeners
    const onTtsStart = () => {
      setState(prev => ({...prev, isPlaying: true}));
      startTimeRef.current = Date.now();
    };

    const onTtsFinish = () => {
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
    };

    const onTtsCancel = () => {
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
    };

    Tts.addEventListener('tts-start', onTtsStart);
    Tts.addEventListener('tts-finish', onTtsFinish);
    Tts.addEventListener('tts-cancel', onTtsCancel);

    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Tts.stop();
      ttsReadyRef.current = false;
    };
  }, [currentLanguage, initializeTTS]);

  const playTTS = React.useCallback(async (text: string) => {
    try {
      if (!text || text.trim() === '') {
        console.warn('TTS: Empty text provided');
        return;
      }

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

      // Ensure TTS is initialized (Android 11+ requirement)
      if (!ttsReadyRef.current) {
        await initializeTTS();
        // Wait a bit more for Android 11+ to ensure TTS engine is ready
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Set language based on current language before speaking
      // This is crucial for Android 11+ to work properly with non-English languages
      const ttsLanguage = getTTSLanguage(currentLanguage);
      try {
        await Tts.setDefaultLanguage(ttsLanguage);
        // Small delay for Android 11+ to ensure language is set before speaking
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
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

      // Start TTS - for Android 11+, ensure language is set and wait before speaking
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
  }, [currentLanguage, initializeTTS]);

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
      
      if (!remainingText || remainingText.trim() === '') {
        console.warn('TTS Resume: No text to resume');
        return;
      }

      // Ensure TTS is initialized
      if (!ttsReadyRef.current) {
        await initializeTTS();
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Set language based on current language before speaking
      const ttsLanguage = getTTSLanguage(currentLanguage);
      try {
        await Tts.setDefaultLanguage(ttsLanguage);
        // Small delay for Android 11+ to ensure language is set
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
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
        // Start TTS - language is already set above
        await Tts.speak(remainingWords);
      }
    } catch (error) {
      console.error('TTS Resume Error:', error);
    }
  }, [state.text, currentLanguage, initializeTTS]);

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

