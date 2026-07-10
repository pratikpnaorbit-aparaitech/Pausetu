import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import Screens
import BuyScreen from '../screens/BuyScreen';
import SellScreen from '../screens/SellScreen';
import BidScreen from '../screens/BidScreen';
import PostScreen from '../screens/PostScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9', // Softer border line
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
          fontSize: 11,
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
          title: 'Buy',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="shopping" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sell"
        component={SellScreen}
        options={{
          title: 'Sell',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cash-plus" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bid"
        component={BidScreen}
        options={{
          title: 'Bid',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="gavel" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          title: 'Post',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-circle-outline" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
