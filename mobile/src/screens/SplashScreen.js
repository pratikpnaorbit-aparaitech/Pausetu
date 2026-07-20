import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '../components/AppText';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [dots, setDots] = useState('...');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={['#F4FBF7', '#FFFFFF']}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image
          source={require('../../assets/logo-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <AppText style={styles.brandAppTitle}>पशुसेतू</AppText>
        <AppText style={styles.brandTitle}>जनावर बाजार</AppText>
        <AppText style={styles.brandSubtitle}>शेतकऱ्यांसाठी सुरक्षित जनावर खरेदी-विक्री</AppText>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <AppText style={styles.loadingText}>लोड होत आहे{dots}</AppText>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  brandAppTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
  },
  loaderContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    minWidth: 90,
    textAlign: 'center',
  },
});
