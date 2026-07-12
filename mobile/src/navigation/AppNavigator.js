import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContext } from '../context/AppContext';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import AuthScreen from '../screens/AuthScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ProfileCompletionScreen from '../screens/ProfileCompletionScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import BottomTabNavigator from './BottomTabNavigator';
import AnimalDetailsScreen from '../screens/AnimalDetailsScreen';
import AddAnimalScreen from '../screens/AddAnimalScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VerificationScreen from '../screens/VerificationScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const {
    isLoading,
    isOnboarded,
    userToken,
    isProfileComplete,
    hasLocationPermission,
  } = useContext(AppContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          // 1. Splash Screen
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !isOnboarded ? (
          // 2. Onboarding Flow (Onboarding Slides -> Language Choice)
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          </>
        ) : !userToken ? (
          // 3. Authentication Flow (Login -> OTP Verify)
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          </>
        ) : !isProfileComplete ? (
          // 4. Profile Completion Screen (First login only)
          <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
        ) : !hasLocationPermission ? (
          // 5. Location Permission Screen
          <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        ) : (
          // 6. Main Dashboard App Tab Navigator, AnimalDetails, AddAnimal, MyListings, Profile, Notifications & Settings Stack
          <>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen name="AnimalDetails" component={AnimalDetailsScreen} />
            <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
            <Stack.Screen name="MyListings" component={MyListingsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
