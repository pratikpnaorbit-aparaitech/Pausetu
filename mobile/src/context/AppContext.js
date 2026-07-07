import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [language, setLanguage] = useState('en');
  const [userToken, setUserToken] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Restore states from storage on boot
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const onboarded = await AsyncStorage.getItem('isOnboarded');
        const lang = await AsyncStorage.getItem('language');
        const token = await AsyncStorage.getItem('userToken');
        const profileComplete = await AsyncStorage.getItem('isProfileComplete');
        const locationGranted = await AsyncStorage.getItem('hasLocationPermission');
        const profile = await AsyncStorage.getItem('userProfile');

        if (onboarded === 'true') setIsOnboarded(true);
        if (lang) setLanguage(lang);
        if (token) setUserToken(token);
        if (profileComplete === 'true') setIsProfileComplete(true);
        if (locationGranted === 'true') setHasLocationPermission(true);
        if (profile) setUserProfile(JSON.parse(profile));
      } catch (e) {
        console.error('Failed to load navigation state from AsyncStorage', e);
      } finally {
        // Add a slight artificial delay for splash display
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    bootstrapAsync();
  }, []);

  const completeOnboarding = async (selectedLang) => {
    try {
      await AsyncStorage.setItem('isOnboarded', 'true');
      await AsyncStorage.setItem('language', selectedLang);
      setIsOnboarded(true);
      setLanguage(selectedLang);
    } catch (e) {
      console.error(e);
    }
  };

  const login = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    } catch (e) {
      console.error(e);
    }
  };

  const loginAsGuest = async () => {
    try {
      await AsyncStorage.setItem('userToken', 'guest');
      setUserToken('guest');
      // For Guest, we skip profile completion and route straight to location / Home
      await AsyncStorage.setItem('isProfileComplete', 'true');
      setIsProfileComplete(true);
    } catch (e) {
      console.error(e);
    }
  };

  const completeProfile = async (profileData) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      await AsyncStorage.setItem('isProfileComplete', 'true');
      setUserProfile(profileData);
      setIsProfileComplete(true);
    } catch (e) {
      console.error(e);
    }
  };

  const grantLocation = async () => {
    try {
      await AsyncStorage.setItem('hasLocationPermission', 'true');
      setHasLocationPermission(true);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('isProfileComplete');
      await AsyncStorage.removeItem('userProfile');
      setUserToken(null);
      setIsProfileComplete(false);
      setUserProfile(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isOnboarded,
        language,
        userToken,
        isProfileComplete,
        hasLocationPermission,
        userProfile,
        completeOnboarding,
        login,
        loginAsGuest,
        completeProfile,
        grantLocation,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
