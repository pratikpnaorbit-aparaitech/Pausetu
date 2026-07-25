import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import i18n from './src/i18n/i18n';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" translucent={false} backgroundColor="#FFFFFF" />
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
