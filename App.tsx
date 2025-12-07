/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StyleSheet, View, Platform } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {StatusBarProvider, useStatusBar} from './src/contexts/StatusBarContext';
import {TTSProvider} from './src/contexts/TTSContext';
import TTSPlayer from './src/components/TTSPlayer';
import {StatusBar} from 'react-native';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBarProvider>
        <TTSProvider>
          <AppContent />
        </TTSProvider>
      </StatusBarProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const {currentConfig} = useStatusBar();

  return (
    <>
      <StatusBar 
        barStyle={currentConfig.barStyle}
        backgroundColor={Platform.OS === 'android' ? currentConfig.backgroundColor : undefined}
        translucent={Platform.OS === 'android' ? false : undefined}
        hidden={false}
      />
      <View style={styles.container}>
        <RootNavigator />
        <TTSPlayer />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;