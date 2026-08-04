import React, { useEffect, useRef, useContext } from 'react';
import { StyleSheet, View, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { hasFeatureAccess } from '../utils/featureAccess';

// Import Screens
import BuyScreen from '../screens/BuyScreen';
import SellScreen from '../screens/SellScreen';
import BidScreen from '../screens/BidScreen';
import FeedPlannerScreen from '../screens/PremiumAdvisor/FeedPlannerScreen';

const Tab = createBottomTabNavigator();

function AnimatedTabIcon({ focused, iconName }) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const bgScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: focused ? 1 : 0.85,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(bgScale, {
        toValue: focused ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={[
        styles.iconBg,
        {
          transform: [{ scale: bgScale }],
          opacity: bgScale,
        }
      ]} />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <MaterialCommunityIcons
          name={iconName}
          size={focused ? 24 : 26}
          color={focused ? '#FFFFFF' : '#64748B'}
        />
      </Animated.View>
    </View>
  );
}

function AnimatedTabLabel({ focused, labelText }) {
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.85)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0.85,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.Text
      style={[
        styles.label,
        focused ? styles.activeLabel : styles.inactiveLabel,
        { opacity: opacityAnim }
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {labelText}
    </Animated.Text>
  );
}

export default function BottomTabNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { userProfile } = useContext(AppContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
          height: Platform.OS === 'ios' ? (60 + Math.max(insets.bottom, 16)) : (60 + Math.max(insets.bottom, 12)),
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 8),
          paddingTop: 8,
          paddingHorizontal: 16,
        },

        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#64748B',

        tabBarIcon: ({ focused }) => {
          let iconName;
          switch (route.name) {
            case 'Buy':
              iconName = 'shopping';
              break;
            case 'Sell':
              iconName = 'cash-plus';
              break;
            case 'Bid':
              iconName = 'trending-up';
              break;
            case 'Post':
              iconName = 'sprout';
              break;
            default:
              iconName = 'circle';
          }
          return <AnimatedTabIcon focused={focused} iconName={iconName} />;
        },

        tabBarLabel: ({ focused }) => {
          let labelKey;
          switch (route.name) {
            case 'Buy':
              labelKey = 'tabs.buy';
              break;
            case 'Sell':
              labelKey = 'tabs.sell';
              break;
            case 'Bid':
              labelKey = 'tabs.marketPrice';
              break;
            case 'Post':
              labelKey = 'tabs.feedPlanner';
              break;
            default:
              labelKey = '';
          }
          return <AnimatedTabLabel focused={focused} labelText={t(labelKey)} />;
        }
      })}
    >
      <Tab.Screen
        name="Buy"
        component={BuyScreen}
        options={{
          title: t('tabs.buy'),
        }}
      />

      <Tab.Screen
        name="Sell"
        component={SellScreen}
        options={{
          title: t('tabs.sell'),
        }}
      />

      <Tab.Screen
        name="Bid"
        component={BidScreen}
        options={{
          title: t('tabs.marketPrice'),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!hasFeatureAccess(userProfile, null, 'marketEstimator')) {
              e.preventDefault();
              navigation.navigate('Subscription');
            }
          },
        })}
      />

      <Tab.Screen
        name="Post"
        component={FeedPlannerScreen}
        options={{
          title: t('tabs.feedPlanner'),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!hasFeatureAccess(userProfile, null, 'feedPlanner')) {
              e.preventDefault();
              navigation.navigate('Subscription');
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 60,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  iconBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#16A34A',
  },
  label: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  activeLabel: {
    fontWeight: '800',
    color: '#16A34A',
  },
  inactiveLabel: {
    fontWeight: '500',
    color: '#64748B',
  }
});