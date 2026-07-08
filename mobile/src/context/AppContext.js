import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, registerLogoutHandler } from '../api/api';
import { profileApi } from '../api/profileApi';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [language, setLanguage] = useState('en');
  const [userToken, setUserToken] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Restore states from storage on boot and sync profile from backend
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const onboarded = await AsyncStorage.getItem('isOnboarded');
        const lang = await AsyncStorage.getItem('language') || 'en';
        const token = await secureStorage.getItem('userToken');
        const locationGranted = await AsyncStorage.getItem('hasLocationPermission');
        const cachedProfile = await AsyncStorage.getItem('userProfile');
        const isGuestStr = await AsyncStorage.getItem('isGuest');

        if (onboarded === 'true') setIsOnboarded(true);
        setLanguage(lang);
        if (locationGranted === 'true') setHasLocationPermission(true);

        if (isGuestStr === 'true') {
          setIsGuest(true);
          setIsProfileComplete(true);
          setUserToken('guest');
        } else if (token && token !== 'null' && token !== 'undefined') {
          // Sync with backend if token exists to validate it
          try {
            const resObj = await profileApi.getProfile();
            if (resObj.status === 'success' && resObj.data.user) {
              const user = resObj.data.user;
              const completeData = {
                id: user._id || user.id,
                name: user.fullName || '',
                email: user.email || '',
                role: user.role === 'seller' ? 'Farmer' : (user.role === 'buyer' ? 'Merchant / Cattle Buyer' : 'Veterinary Doctor'),
                mobile: user.mobile || '',
                village: user.village || '',
                taluka: user.taluka || '',
                district: user.district || '',
                state: user.state || '',
                photo: user.photo || '',
                language: user.preferredLanguage || lang
              };
              await AsyncStorage.setItem('userProfile', JSON.stringify(completeData));
              setUserProfile(completeData);
              if (user.isProfileCompleted) {
                await AsyncStorage.setItem('isProfileComplete', 'true');
                setIsProfileComplete(true);
              } else {
                await AsyncStorage.setItem('isProfileComplete', 'false');
                setIsProfileComplete(false);
              }
              setUserToken(token);
            } else {
              await logout();
            }
          } catch (syncErr) {
            console.warn('[Sync Warning] Backend profile synchronization failed:', syncErr.message);
            // Check if it's an auth error vs network issue
            const isNetworkError = syncErr.message && (
              syncErr.message.includes('Network') ||
              syncErr.message.includes('network') ||
              syncErr.message.includes('timeout') ||
              syncErr.message.includes('connect')
            );
            if (isNetworkError) {
              // Fallback to cache if offline
              const profileComplete = await AsyncStorage.getItem('isProfileComplete');
              if (profileComplete === 'true') setIsProfileComplete(true);
              if (cachedProfile) setUserProfile(JSON.parse(cachedProfile));
              setUserToken(token);
            } else {
              // 401/Invalid token, logout
              await logout();
            }
          }
        }
      } catch (e) {
        console.error('Failed to load navigation state from AsyncStorage', e);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    bootstrapAsync();
  }, []);

  // Register the Axios 401 unauth session expiry handler on mount
  useEffect(() => {
    registerLogoutHandler(logout);
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

  const login = async (accessToken, refreshToken, user) => {
    try {
      await secureStorage.setItem('userToken', accessToken);
      if (refreshToken) {
        await secureStorage.setItem('refreshToken', refreshToken);
      }
      
      let currentUser = user;
      if (!currentUser) {
        const resObj = await profileApi.getProfile();
        if (resObj.status === 'success' && resObj.data.user) {
          currentUser = resObj.data.user;
        }
      }

      if (currentUser) {
        const completeData = {
          id: currentUser._id || currentUser.id,
          name: currentUser.fullName || currentUser.name || '',
          email: currentUser.email || '',
          role: currentUser.role === 'seller' ? 'Farmer' : (currentUser.role === 'buyer' ? 'Merchant / Cattle Buyer' : 'Veterinary Doctor'),
          mobile: currentUser.mobile || '',
          village: currentUser.village || '',
          taluka: currentUser.taluka || '',
          district: currentUser.district || '',
          state: currentUser.state || '',
          photo: currentUser.photo || '',
          language: currentUser.preferredLanguage || 'en'
        };
        await AsyncStorage.setItem('userProfile', JSON.stringify(completeData));
        setUserProfile(completeData);

        if (currentUser.isProfileCompleted) {
          await AsyncStorage.setItem('isProfileComplete', 'true');
          setIsProfileComplete(true);
        } else {
          await AsyncStorage.setItem('isProfileComplete', 'false');
          setIsProfileComplete(false);
        }
      } else {
        await AsyncStorage.setItem('isProfileComplete', 'false');
        setIsProfileComplete(false);
      }

      // Set userToken last to trigger navigator only when profile states are fully ready
      setUserToken(accessToken);
    } catch (e) {
      console.warn('[Context Warning] Profile load failed, user must complete details:', e.message);
      await AsyncStorage.setItem('isProfileComplete', 'false');
      setIsProfileComplete(false);
      setUserToken(accessToken);
    }
  };

  const loginAsGuest = async () => {
    try {
      await secureStorage.setItem('userToken', 'guest');
      await AsyncStorage.setItem('isGuest', 'true');
      await AsyncStorage.setItem('isProfileComplete', 'true');
      setUserToken('guest');
      setIsGuest(true);
      setIsProfileComplete(true);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshProfileData = async () => {
    try {
      const resObj = await profileApi.getProfile();
      if (resObj.status === 'success' && resObj.data.user) {
        const user = resObj.data.user;
        const completeData = {
          id: user._id || user.id,
          name: user.fullName || '',
          email: user.email || '',
          role: user.role === 'seller' ? 'Farmer' : (user.role === 'buyer' ? 'Merchant / Cattle Buyer' : 'Veterinary Doctor'),
          mobile: user.mobile || '',
          village: user.village || '',
          taluka: user.taluka || '',
          district: user.district || '',
          state: user.state || '',
          photo: user.photo || '',
          language: user.preferredLanguage || 'en'
        };
        await AsyncStorage.setItem('userProfile', JSON.stringify(completeData));
        setUserProfile(completeData);
      }
    } catch (e) {
      console.error('[Context Error] Profile refresh failed:', e);
    }
  };

  const completeProfile = async (profileData) => {
    try {
      const payload = {
        fullName: profileData.name,
        role: profileData.role === 'Farmer' ? 'seller' : (profileData.role === 'Veterinary Doctor' ? 'doctor' : 'buyer'),
        mobile: profileData.mobile || '9988776655',
        state: profileData.state || 'Maharashtra',
        district: profileData.district || 'Pune',
        taluka: profileData.taluka || 'Purandar',
        village: profileData.village || 'Saswad',
        preferredLanguage: profileData.language || language
      };
      
      await profileApi.updateProfile(payload);
      await refreshProfileData();
      await AsyncStorage.setItem('isProfileComplete', 'true');
      setIsProfileComplete(true);
    } catch (e) {
      console.error('[Context Error] Profile complete failed:', e);
      // Fallback local complete
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      await AsyncStorage.setItem('isProfileComplete', 'true');
      setUserProfile(profileData);
      setIsProfileComplete(true);
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
      await secureStorage.removeItem('userToken');
      await secureStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('isProfileComplete');
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.removeItem('hasLocationPermission');
      await AsyncStorage.removeItem('isGuest');
      setUserToken(null);
      setIsProfileComplete(false);
      setUserProfile(null);
      setHasLocationPermission(false);
      setIsGuest(false);
    } catch (e) {
      console.error('[Context Error] Logout failed:', e);
    }
  };

  const exitGuestSession = async () => {
    try {
      await secureStorage.removeItem('userToken');
      await AsyncStorage.removeItem('isGuest');
      await AsyncStorage.removeItem('isProfileComplete');
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.removeItem('hasLocationPermission');
      await AsyncStorage.removeItem('guest_preferences');
      await AsyncStorage.removeItem('cached_filters');
      await AsyncStorage.removeItem('cached_location');
      
      setUserToken(null);
      setIsGuest(false);
      setIsProfileComplete(false);
      setUserProfile(null);
      setHasLocationPermission(false);
    } catch (e) {
      console.error('[Context Error] Exit guest session failed:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isOnboarded,
        language,
        userToken,
        isGuest,
        isProfileComplete,
        hasLocationPermission,
        userProfile,
        completeOnboarding,
        login,
        loginAsGuest,
        completeProfile,
        grantLocation,
        logout,
        exitGuestSession,
        refreshProfileData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
