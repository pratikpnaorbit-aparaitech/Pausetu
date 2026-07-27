import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, registerLogoutHandler } from '../api/api';
import { profileApi } from '../api/profileApi';
import i18n from '../i18n/i18n';
import { Asset } from 'expo-asset';
import { refreshManager, REFRESH_EVENTS } from '../services/refreshManager';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [language, setLanguage] = useState('mr');
  const [userToken, setUserToken] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('Medium'); // 'Small' | 'Medium' | 'Large'
  const [favorites, setFavorites] = useState([]);

  const hasMeaningfulProfileData = (user) => {
    if (!user) return false;

    return Boolean(
      user.fullName ||
      user.name ||
      user.email ||
      user.mobile ||
      user.role ||
      user.village ||
      user.taluka ||
      user.district ||
      user.state ||
      user.profilePhoto ||
      user.photo
    );
  };

  const normalizeProfileData = (user, fallbackLanguage = language) => {
    if (!user || !hasMeaningfulProfileData(user)) return null;

    return {
      id: user._id || user.id || null,
      name: user.fullName || user.name || '',
      email: user.email || '',
      role: user.role === 'seller'
        ? 'Farmer'
        : user.role === 'buyer'
          ? 'Merchant / Cattle Buyer'
          : user.role === 'doctor'
            ? 'Veterinary Doctor'
            : '',
      mobile: user.mobile || '',
      village: user.village || '',
      taluka: user.taluka || '',
      district: user.district || '',
      state: user.state || '',
      profilePhoto: user.profilePhoto || '',
      photo: user.profilePhoto || user.photo || '',
      language: user.preferredLanguage || fallbackLanguage,
      verification: user.verification || { status: 'unverified' }
    };
  };

  // Restore states from storage on boot and sync profile from backend
  useEffect(() => {
    const bootstrapAsync = async () => {
      setIsProfileLoading(true);

      try {
        console.log('[AppBoot Debug] Starting bootstrapAsync');
        // Preload essential logo assets with safety catch to prevent startup hang
        try {
          console.log('[AppBoot Debug] Preloading assets...');
          await Asset.loadAsync([
            require('../../assets/logo-full.png'),
            require('../../assets/logo-icon.png')
          ]);
          console.log('[AppBoot Debug] Assets loaded.');
        } catch (assetErr) {
          console.warn('[AppBoot Warning] Preloading assets failed, continuing:', assetErr.message);
        }

        console.log('[AppBoot Debug] Reading AsyncStorage keys...');
        const onboarded = await AsyncStorage.getItem('isOnboarded');
        const lang = await AsyncStorage.getItem('language') || 'mr';
        console.log('[AppBoot Debug] Reading secure storage for userToken...');
        const token = await secureStorage.getItem('userToken');
        console.log('[AppBoot Debug] userToken loaded:', token);
        const locationGranted = await AsyncStorage.getItem('hasLocationPermission');
        const cachedProfile = await AsyncStorage.getItem('userProfile');
        const isGuestStr = await AsyncStorage.getItem('isGuest');
        const storedDarkMode = await AsyncStorage.getItem('isDarkMode');
        const storedFontSize = await AsyncStorage.getItem('fontSize');

        if (onboarded === 'true') setIsOnboarded(true);
        setLanguage(lang);
        // Sync i18n to the persisted language on every boot
        i18n.changeLanguage(lang);
        if (locationGranted === 'true') setHasLocationPermission(true);
        if (storedDarkMode === 'true') setIsDarkMode(true);
        if (storedFontSize) setFontSize(storedFontSize);

        if (isGuestStr === 'true') {
          setIsGuest(true);
          setIsProfileComplete(true);
          setUserProfile(null);
          setUserToken('guest');
        } else if (token && token !== 'null' && token !== 'undefined') {
          try {
            const resObj = await profileApi.getProfile();
            if (resObj?.status === 'success' && resObj.data?.user) {
              const user = resObj.data.user;
              const completeData = normalizeProfileData(user, lang);
              await AsyncStorage.setItem('userProfile', JSON.stringify(completeData));
              setUserProfile(completeData);
              const isComplete = Boolean(user.fullName || user.isProfileCompleted);
              await AsyncStorage.setItem('isProfileComplete', isComplete ? 'true' : 'false');
              setIsProfileComplete(isComplete);
              setUserToken(token);
            } else {
              await AsyncStorage.removeItem('userProfile');
              setUserProfile(null);
              setIsProfileComplete(false);
              setUserToken(token);
            }
          } catch (syncErr) {
            console.warn('[Sync Warning] Backend profile synchronization failed:', syncErr.message);
            const isNetworkError = syncErr.message && (
              syncErr.message.includes('Network') ||
              syncErr.message.includes('network') ||
              syncErr.message.includes('timeout') ||
              syncErr.message.includes('connect')
            );
            if (isNetworkError) {
              const profileComplete = await AsyncStorage.getItem('isProfileComplete');
              if (profileComplete === 'true') setIsProfileComplete(true);
              if (cachedProfile) {
                setUserProfile(JSON.parse(cachedProfile));
              } else {
                setUserProfile(null);
              }
              setUserToken(token);
            } else {
              await logout();
            }
          }
        } else {
          setUserProfile(null);
          setIsProfileComplete(false);
          setUserToken(null);
        }
      } catch (e) {
        console.error('Failed to load navigation state from AsyncStorage', e);
      } finally {
        setIsProfileLoading(false);
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

  // Fetch favorites whenever the userToken is set
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userToken || userToken === 'guest') {
        setFavorites([]);
        return;
      }
      try {
        const { api } = require('../api/api');
        const res = await api.getFavorites();
        if (res?.status === 'success') {
          const favIds = (res.data || []).map(f => String(f._id ?? f.id ?? f).trim());
          setFavorites(favIds);
        }
      } catch (e) {
        console.warn('Failed to fetch initial favorites in AppContext', e);
      }
    };
    fetchFavorites();
  }, [userToken]);

  const toggleFavoriteContext = async (animalId) => {
    if (!userToken || userToken === 'guest') return { success: false, reason: 'auth' };
    
    const { api } = require('../api/api');
    const normId = String(animalId).trim();
    const isCurrentlyFav = favorites.includes(normId);
    
    // Optimistic Update
    setFavorites(prev => isCurrentlyFav ? prev.filter(id => id !== normId) : [...prev, normId]);
    
    try {
      const res = await api.toggleFavorite(normId);
      if (res?.status !== 'success') {
        // Rollback
        setFavorites(prev => isCurrentlyFav ? [...prev, normId] : prev.filter(id => id !== normId));
        return { success: false };
      }
      return { success: true, isFavorited: res.isFavorited };
    } catch (e) {
      // Rollback
      setFavorites(prev => isCurrentlyFav ? [...prev, normId] : prev.filter(id => id !== normId));
      return { success: false };
    }
  };

  const completeOnboarding = async (selectedLang) => {
    try {
      await AsyncStorage.setItem('isOnboarded', 'true');
      await AsyncStorage.setItem('language', selectedLang);
      setIsOnboarded(true);
      setLanguage(selectedLang);
      // Immediately update i18n so all useTranslation() hooks re-render
      await i18n.changeLanguage(selectedLang);
    } catch (e) {
      console.error(e);
    }
  };

  const changeAppLanguage = async (selectedLang) => {
    try {
      await AsyncStorage.setItem('language', selectedLang);
      setLanguage(selectedLang);
      await i18n.changeLanguage(selectedLang);
    } catch (e) {
      console.error('[AppContext] changeAppLanguage failed:', e);
    }
  };

  const login = async (accessToken, refreshToken, user) => {
    setIsProfileLoading(true);
    setUserProfile(null);

    try {
      await secureStorage.setItem('userToken', accessToken);
      if (refreshToken) {
        await secureStorage.setItem('refreshToken', refreshToken);
      }

      let currentUser = user;
      let profileData = normalizeProfileData(currentUser);
      if (!profileData) {
        try {
          const resObj = await profileApi.getProfile();
          if (resObj?.status === 'success' && resObj.data?.user) {
            currentUser = resObj.data.user;
            profileData = normalizeProfileData(currentUser);
          }
        } catch (profileError) {
          console.warn('[Context Warning] Profile load failed, user must complete details:', profileError.message);
        }
      }

      if (profileData) {
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
        setUserProfile(profileData);
        const isComplete = Boolean(currentUser?.fullName || currentUser?.isProfileCompleted);
        await AsyncStorage.setItem('isProfileComplete', isComplete ? 'true' : 'false');
        setIsProfileComplete(isComplete);
      } else {
        await AsyncStorage.removeItem('userProfile');
        await AsyncStorage.setItem('isProfileComplete', 'false');
        setIsProfileComplete(false);
      }

      // Set userToken last to trigger navigator only when profile states are fully ready
      setUserToken(accessToken);
    } catch (e) {
      console.warn('[Context Warning] Profile load failed, user must complete details:', e.message);
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.setItem('isProfileComplete', 'false');
      setIsProfileComplete(false);
      setUserToken(accessToken);
    } finally {
      setIsProfileLoading(false);
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
    setIsProfileLoading(true);

    try {
      const resObj = await profileApi.getProfile();
      if (resObj?.status === 'success' && resObj.data?.user) {
        const user = resObj.data.user;
        const completeData = normalizeProfileData(user);
        await AsyncStorage.setItem('userProfile', JSON.stringify(completeData));
        setUserProfile(completeData);

        const isComplete = Boolean(user.fullName || user.isProfileCompleted);
        await AsyncStorage.setItem('isProfileComplete', isComplete ? 'true' : 'false');
        setIsProfileComplete(isComplete);

        refreshManager.emit(REFRESH_EVENTS.PROFILE_UPDATED, completeData);
      } else {
        setUserProfile(null);
        setIsProfileComplete(false);
      }
    } catch (e) {
      console.error('[Context Error] Profile refresh failed:', e);
      setUserProfile(null);
      setIsProfileComplete(false);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const completeProfile = async (profileData) => {
    try {
      const payload = {
        fullName: profileData.name,
        role: profileData.role === 'Farmer' ? 'seller' : (profileData.role === 'Veterinary Doctor' ? 'doctor' : 'buyer'),
        mobile: profileData.mobile,
        state: profileData.state,
        district: profileData.district,
        taluka: profileData.taluka,
        village: profileData.village,
        preferredLanguage: profileData.language
      };

      await profileApi.updateProfile(payload);
      await refreshProfileData();
      await AsyncStorage.setItem('isProfileComplete', 'true');
      setIsProfileComplete(true);
    } catch (e) {
      console.error('[Context Error] Profile complete failed:', e);
      const fallbackProfile = {
        ...userProfile,
        ...profileData,
        name: profileData.name || userProfile?.name,
        verification: userProfile?.verification || { status: 'unverified' }
      };
      await AsyncStorage.setItem('userProfile', JSON.stringify(fallbackProfile));
      await AsyncStorage.setItem('isProfileComplete', 'true');
      setUserProfile(fallbackProfile);
      setIsProfileComplete(true);
    }
  };

  const updateLocation = async (locData) => {
    if (!locData) return;

    try {
      const newVillage = locData.village !== undefined ? locData.village : (userProfile?.village || '');
      const newTaluka = locData.taluka !== undefined ? locData.taluka : (userProfile?.taluka || '');
      const newDistrict = locData.district !== undefined ? locData.district : (userProfile?.district || '');
      const newState = locData.state !== undefined ? locData.state : (userProfile?.state || '');

      const updated = {
        ...userProfile,
        name: userProfile?.name || 'Guest',
        role: userProfile?.role || 'Farmer',
        mobile: userProfile?.mobile || '',
        language: userProfile?.language || language || 'en',
        village: newVillage,
        taluka: newTaluka,
        district: newDistrict,
        state: newState,
        verification: userProfile?.verification || { status: 'unverified' }
      };

      // 1. Synchronously update context state & AsyncStorage for immediate UI refresh
      setUserProfile(updated);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
      refreshManager.emit(REFRESH_EVENTS.LOCATION_UPDATED, updated);
      refreshManager.emit(REFRESH_EVENTS.PROFILE_UPDATED, updated);

      // 2. Persist to backend asynchronously if logged in
      if (userToken && userToken !== 'guest') {
        const payload = {
          fullName: updated.name,
          role: updated.role === 'Farmer' ? 'seller' : (updated.role === 'Veterinary Doctor' ? 'doctor' : 'buyer'),
          mobile: updated.mobile,
          state: updated.state,
          district: updated.district,
          taluka: updated.taluka,
          village: updated.village,
          preferredLanguage: updated.language
        };
        await profileApi.updateProfile(payload);
      }
    } catch (e) {
      console.error('[Context Error] updateLocation failed:', e);
      const fallback = {
        ...userProfile,
        village: locData.village !== undefined ? locData.village : (userProfile?.village || ''),
        taluka: locData.taluka !== undefined ? locData.taluka : (userProfile?.taluka || ''),
        district: locData.district !== undefined ? locData.district : (userProfile?.district || ''),
        state: locData.state !== undefined ? locData.state : (userProfile?.state || '')
      };
      setUserProfile(fallback);
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

  // Toggle dark mode and persist
  const toggleDarkMode = async () => {
    try {
      const next = !isDarkMode;
      setIsDarkMode(next);
      await AsyncStorage.setItem('isDarkMode', next ? 'true' : 'false');
    } catch (e) {
      console.error('[AppContext] toggleDarkMode failed:', e);
    }
  };

  // Set font size and persist
  const setAppFontSize = async (size) => {
    try {
      setFontSize(size);
      await AsyncStorage.setItem('fontSize', size);
    } catch (e) {
      console.error('[AppContext] setAppFontSize failed:', e);
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
      setIsProfileLoading(false);
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
      setIsProfileLoading(false);
      setUserProfile(null);
      setHasLocationPermission(false);
    } catch (e) {
      console.error('[Context Error] Exit guest session failed:', e);
    }
  };

  const contextValue = useMemo(() => ({
    isLoading,
    isOnboarded,
    language,
    userToken,
    isGuest,
    isProfileComplete,
    hasLocationPermission,
    userProfile,
    isProfileLoading,
    isDarkMode,
    fontSize,
    completeOnboarding,
    login,
    loginAsGuest,
    completeProfile,
    grantLocation,
    logout,
    exitGuestSession,
    refreshProfileData,
    toggleDarkMode,
    setAppFontSize,
    updateLocation,
    changeAppLanguage,
    favorites,
    toggleFavoriteContext,
  }), [
    isLoading,
    isOnboarded,
    language,
    userToken,
    isGuest,
    isProfileComplete,
    hasLocationPermission,
    userProfile,
    isProfileLoading,
    isDarkMode,
    fontSize,
    favorites
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
