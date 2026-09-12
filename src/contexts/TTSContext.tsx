import React, {createContext, useContext, useState, useRef, ReactNode} from 'react';
import Tts from 'react-native-tts';
import {Platform, StyleSheet, View} from 'react-native';
import Video from 'react-native-video';
import {useLanguage} from './LanguageContext';
import {
  buildFallbackTtsUrl,
  estimateFallbackDuration,
  estimateSpeechDuration,
  splitTextForFallbackTTS,
} from '../utils/fallbackTTS';

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

type TTSVoice = {
  id: string;
  language?: string;
  quality?: number;
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
  const [fallbackUri, setFallbackUri] = useState<string | null>(null);
  const [fallbackPaused, setFallbackPaused] = useState(true);
  const [fallbackChunkKey, setFallbackChunkKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedPositionRef = useRef<number>(0);
  const ttsReadyRef = useRef<boolean>(false);
  const iosVoiceIdRef = useRef<string | null>(null);
  const useFallbackRef = useRef<boolean>(false);
  const chunkQueueRef = useRef<string[]>([]);
  const chunkIndexRef = useRef<number>(0);
  const completedChunkDurationRef = useRef<number>(0);
  const chunkDurationsRef = useRef<number[]>([]);
  const currentChunkTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const {currentLanguage} = useLanguage();

  const clearProgressInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updatePlaybackProgress = React.useCallback((position: number) => {
    const safeDuration = durationRef.current;
    if (safeDuration <= 0) {
      return;
    }

    const currentPosition = Math.min(Math.max(position, 0), safeDuration);
    const progress = Math.min((currentPosition / safeDuration) * 100, 100);

    setState(prev => ({
      ...prev,
      currentPosition,
      progress,
    }));
  }, []);

  const startNativeProgressInterval = () => {
    clearProgressInterval();
    intervalRef.current = setInterval(() => {
      if (useFallbackRef.current) {
        return;
      }

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentPos = pausedPositionRef.current + elapsed;
      updatePlaybackProgress(currentPos);
    }, 200);
  };

  const startFallbackProgressInterval = () => {
    clearProgressInterval();
    intervalRef.current = setInterval(() => {
      if (!useFallbackRef.current) {
        return;
      }

      const totalPosition =
        completedChunkDurationRef.current + currentChunkTimeRef.current;
      updatePlaybackProgress(totalPosition);
    }, 200);
  };

  const finishPlayback = () => {
    clearProgressInterval();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      progress: 100,
      currentPosition: prev.duration,
    }));
  };

  const cancelPlayback = () => {
    clearProgressInterval();
    durationRef.current = 0;
    setState(prev => ({
      ...prev,
      isPlaying: false,
      progress: 0,
      currentPosition: 0,
    }));
    pausedPositionRef.current = 0;
  };

  const resetFallbackProgress = () => {
    completedChunkDurationRef.current = 0;
    chunkDurationsRef.current = [];
    currentChunkTimeRef.current = 0;
  };

  const getTTSLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      gu: 'gu-IN',
    };
    return languageMap[lang] || 'en-IN';
  };

  const resolveIOSVoice = React.useCallback(async (lang: string): Promise<string | null> => {
    const ttsLanguage = getTTSLanguage(lang);
    const langPrefix = ttsLanguage.split('-')[0];

    try {
      const voices = (await Tts.voices()) as TTSVoice[];
      if (!voices?.length) {
        return null;
      }

      const matching = voices.filter(
        voice =>
          voice.language === ttsLanguage ||
          voice.language?.startsWith(`${langPrefix}-`) ||
          voice.language === langPrefix,
      );

      if (!matching.length) {
        return null;
      }

      matching.sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0));
      return matching[0].id;
    } catch (error) {
      console.warn('TTS iOS voice lookup error:', error);
      return null;
    }
  }, []);

  const setupIOSVoice = React.useCallback(async (lang: string): Promise<boolean> => {
    try {
      await Tts.setIgnoreSilentSwitch('ignore');
    } catch (error) {
      console.warn('TTS ignore silent switch error:', error);
    }

    const voiceId = await resolveIOSVoice(lang);
    if (voiceId) {
      await Tts.setDefaultVoice(voiceId);
      iosVoiceIdRef.current = voiceId;
      useFallbackRef.current = false;
      return true;
    }

    const ttsLanguage = getTTSLanguage(lang);
    try {
      await Tts.setDefaultLanguage(ttsLanguage);
      iosVoiceIdRef.current = null;
      useFallbackRef.current = false;
      return true;
    } catch (error) {
      console.warn('TTS iOS language setting error:', error);
      iosVoiceIdRef.current = null;
      useFallbackRef.current = true;
      return false;
    }
  }, [resolveIOSVoice]);

  const configureSpeechSettings = React.useCallback(async () => {
    try {
      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);
    } catch (error) {
      console.warn('TTS speech settings error:', error);
    }
  }, []);

  const stopFallbackPlayback = React.useCallback(() => {
    chunkQueueRef.current = [];
    chunkIndexRef.current = 0;
    useFallbackRef.current = false;
    resetFallbackProgress();
    setFallbackPaused(true);
    setFallbackUri(null);
  }, []);

  const syncFallbackDuration = React.useCallback(() => {
    const loadedTotal = chunkDurationsRef.current.reduce(
      (total, duration) => total + (duration || 0),
      0,
    );
    const unloadedChunks = chunkQueueRef.current.slice(chunkDurationsRef.current.length);
    const estimatedUnloaded = estimateFallbackDuration(
      unloadedChunks.join(' '),
      currentLanguage,
    );
    const nextDuration = Math.max(durationRef.current, loadedTotal + estimatedUnloaded);

    durationRef.current = nextDuration;
    setState(prev => ({
      ...prev,
      duration: nextDuration,
    }));
  }, [currentLanguage]);

  const playFallbackChunk = React.useCallback(
    (index: number) => {
      if (index >= chunkQueueRef.current.length) {
        stopFallbackPlayback();
        finishPlayback();
        return;
      }

      chunkIndexRef.current = index;
      currentChunkTimeRef.current = 0;
      const chunk = chunkQueueRef.current[index];
      setFallbackUri(buildFallbackTtsUrl(chunk, currentLanguage));
      setFallbackChunkKey(prev => prev + 1);
      setFallbackPaused(false);
      setState(prev => ({...prev, isPlaying: true}));
      updatePlaybackProgress(completedChunkDurationRef.current);
      startFallbackProgressInterval();
    },
    [currentLanguage, stopFallbackPlayback, updatePlaybackProgress],
  );

  const startFallbackTTS = React.useCallback(
    (text: string) => {
      const chunks = splitTextForFallbackTTS(text);
      if (!chunks.length) {
        return;
      }

      useFallbackRef.current = true;
      chunkQueueRef.current = chunks;
      chunkIndexRef.current = 0;
      resetFallbackProgress();
      playFallbackChunk(0);
    },
    [playFallbackChunk],
  );

  const handleFallbackLoad = React.useCallback(
    (data: {duration: number}) => {
      const duration = data?.duration || 0;
      chunkDurationsRef.current[chunkIndexRef.current] = duration;
      syncFallbackDuration();
    },
    [syncFallbackDuration],
  );

  const handleFallbackProgress = React.useCallback(
    (data: {currentTime: number}) => {
      currentChunkTimeRef.current = data?.currentTime || 0;
      updatePlaybackProgress(
        completedChunkDurationRef.current + currentChunkTimeRef.current,
      );
    },
    [updatePlaybackProgress],
  );

  const handleFallbackEnd = React.useCallback(() => {
    const chunkDuration =
      chunkDurationsRef.current[chunkIndexRef.current] ||
      currentChunkTimeRef.current ||
      chunkQueueRef.current[chunkIndexRef.current]?.length / 12 ||
      0;

    completedChunkDurationRef.current += chunkDuration;
    currentChunkTimeRef.current = 0;
    updatePlaybackProgress(completedChunkDurationRef.current);
    playFallbackChunk(chunkIndexRef.current + 1);
  }, [playFallbackChunk, updatePlaybackProgress]);

  const handleFallbackError = React.useCallback(
    (error: unknown) => {
      console.error('Fallback TTS error:', error);
      stopFallbackPlayback();
      cancelPlayback();
    },
    [stopFallbackPlayback],
  );

  const initializeTTS = React.useCallback(async () => {
    try {
      await Tts.stop();
      stopFallbackPlayback();

      if (Platform.OS === 'ios') {
        await setupIOSVoice(currentLanguage);
      } else {
        const ttsLanguage = getTTSLanguage(currentLanguage);
        try {
          await Tts.setDefaultLanguage(ttsLanguage);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (langError) {
          console.warn('TTS Language setting error:', langError);
        }
      }

      await configureSpeechSettings();
      ttsReadyRef.current = true;
    } catch (error) {
      console.error('TTS Initialization Error:', error);
      ttsReadyRef.current = false;
    }
  }, [configureSpeechSettings, currentLanguage, setupIOSVoice, stopFallbackPlayback]);

  React.useEffect(() => {
    initializeTTS();

    const onTtsStart = () => {
      setState(prev => ({...prev, isPlaying: true}));
      startTimeRef.current = Date.now();
      startNativeProgressInterval();
    };

    const onTtsFinish = () => {
      finishPlayback();
    };

    const onTtsCancel = () => {
      cancelPlayback();
    };

    Tts.addEventListener('tts-start', onTtsStart);
    Tts.addEventListener('tts-finish', onTtsFinish);
    Tts.addEventListener('tts-cancel', onTtsCancel);

    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      clearProgressInterval();
      Tts.stop();
      stopFallbackPlayback();
      ttsReadyRef.current = false;
      iosVoiceIdRef.current = null;
    };
  }, [currentLanguage, initializeTTS, stopFallbackPlayback]);

  const prepareVoice = React.useCallback(async (): Promise<'native' | 'fallback'> => {
    if (!ttsReadyRef.current) {
      await initializeTTS();
      if (Platform.OS === 'android') {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (Platform.OS === 'ios') {
      const voiceReady = await setupIOSVoice(currentLanguage);
      return voiceReady ? 'native' : 'fallback';
    }

    const ttsLanguage = getTTSLanguage(currentLanguage);
    try {
      await Tts.setDefaultLanguage(ttsLanguage);
      if (Platform.OS === 'android') {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (langError) {
      console.warn('TTS Language setting error, using default:', langError);
    }

    return 'native';
  }, [currentLanguage, initializeTTS, setupIOSVoice]);

  const getSpeakOptions = () => {
    if (Platform.OS === 'ios' && iosVoiceIdRef.current) {
      return {iosVoiceId: iosVoiceIdRef.current};
    }
    return undefined;
  };

  const playTTS = React.useCallback(
    async (text: string) => {
      try {
        if (!text || text.trim() === '') {
          console.warn('TTS: Empty text provided');
          return;
        }

        await Tts.stop();
        stopFallbackPlayback();

        const mode = await prepareVoice();
        const estimatedDuration =
          mode === 'fallback' && Platform.OS === 'ios'
            ? estimateFallbackDuration(text, currentLanguage)
            : estimateSpeechDuration(text, currentLanguage);

        durationRef.current = estimatedDuration;
        pausedPositionRef.current = 0;

        setState({
          isPlaying: false,
          text,
          progress: 0,
          duration: estimatedDuration,
          currentPosition: 0,
        });

        if (mode === 'fallback' && Platform.OS === 'ios') {
          startFallbackTTS(text);
          return;
        }

        startTimeRef.current = Date.now();
        await Tts.speak(text, getSpeakOptions());
        startNativeProgressInterval();
      } catch (error) {
        console.error('TTS Error:', error);
        setState(prev => ({...prev, isPlaying: false}));
      }
    },
    [currentLanguage, prepareVoice, startFallbackTTS, stopFallbackPlayback],
  );

  const stopTTS = React.useCallback(async () => {
    try {
      if (useFallbackRef.current) {
        stopFallbackPlayback();
        cancelPlayback();
        return;
      }

      await Tts.stop();
      cancelPlayback();
    } catch (error) {
      console.error('TTS Stop Error:', error);
    }
  }, [stopFallbackPlayback]);

  const pauseTTS = React.useCallback(async () => {
    try {
      if (useFallbackRef.current) {
        const pausedPosition =
          completedChunkDurationRef.current + currentChunkTimeRef.current;
        pausedPositionRef.current = pausedPosition;
        setFallbackPaused(true);
        clearProgressInterval();
        setState(prev => ({
          ...prev,
          isPlaying: false,
          currentPosition: pausedPosition,
          progress:
            prev.duration > 0
              ? Math.min((pausedPosition / prev.duration) * 100, 100)
              : 0,
        }));
        return;
      }

      await Tts.stop();
      setState(prev => {
        pausedPositionRef.current = prev.currentPosition;
        return {...prev, isPlaying: false};
      });
      clearProgressInterval();
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

      if (useFallbackRef.current && fallbackUri) {
        setFallbackPaused(false);
        setState(prev => ({...prev, isPlaying: true}));
        startFallbackProgressInterval();
        return;
      }

      const mode = await prepareVoice();

      if (mode === 'fallback' && Platform.OS === 'ios') {
        const charsPerSecond = 12;
        const charsToSkip = Math.floor(currentPos * charsPerSecond);
        const remainingWords = remainingText.slice(charsToSkip).trim();
        if (remainingWords) {
          durationRef.current = estimateFallbackDuration(remainingWords, currentLanguage);
          startFallbackTTS(remainingWords);
        }
        return;
      }

      const wordsPerSecond = 150 / 60;
      const wordsToSkip = Math.floor(currentPos * wordsPerSecond);
      const words = remainingText.split(/\s+/);
      const remainingWords = words.slice(wordsToSkip).join(' ');

      if (remainingWords.trim()) {
        startTimeRef.current = Date.now() - pausedPositionRef.current * 1000;
        setState(prev => ({...prev, isPlaying: true}));
        await Tts.speak(remainingWords, getSpeakOptions());
        startNativeProgressInterval();
      }
    } catch (error) {
      console.error('TTS Resume Error:', error);
    }
  }, [currentLanguage, fallbackUri, prepareVoice, startFallbackTTS, state.text]);

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
      {Platform.OS === 'ios' && fallbackUri ? (
        <View style={styles.hiddenPlayer} pointerEvents="none">
          <Video
            key={`fallback-${fallbackChunkKey}`}
            source={{uri: fallbackUri}}
            audioOnly
            paused={fallbackPaused}
            playInBackground
            ignoreSilentSwitch="ignore"
            progressUpdateInterval={250}
            onLoad={handleFallbackLoad}
            onProgress={handleFallbackProgress}
            onEnd={handleFallbackEnd}
            onError={handleFallbackError}
          />
        </View>
      ) : null}
    </TTSContext.Provider>
  );
}

const styles = StyleSheet.create({
  hiddenPlayer: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
  },
});

export function useTTS() {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within TTSProvider');
  }
  return context;
}
