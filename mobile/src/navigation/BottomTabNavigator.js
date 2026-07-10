import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import { useFontScale } from '../hooks/useTypography';

// Import Screens
import BuyScreen from '../screens/BuyScreen';
import SellScreen from '../screens/SellScreen';
import BidScreen from '../screens/BidScreen';
import PostScreen from '../screens/PostScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const { t } = useTranslation();
  const fontScale = useFontScale();
  const scaledTabLabel = Math.round(11 * fontScale);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        },
        headerTintColor: '#0F172A',
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          height: 66,
          borderTopWidth: 0,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 8,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: scaledTabLabel,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tab.Screen
        name="Buy"
        component={BuyScreen}
        options={{
          title: t('tabs.buy'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="shopping" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sell"
        component={SellScreen}
        options={{
          title: t('tabs.sell'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cash-plus" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bid"
        component={BidScreen}
        options={{
          title: t('tabs.bid'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="gavel" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          title: t('tabs.post'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-circle-outline" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

