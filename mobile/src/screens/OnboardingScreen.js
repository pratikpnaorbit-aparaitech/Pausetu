import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
    iconName: 'paw',
    colors: ['#FFFFFF', '#F0FDF4'],
  },
  {
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
    iconName: 'hospital-building',
    colors: ['#FFFFFF', '#ECFDF5'],
  },
  {
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
    iconName: 'trending-up',
    colors: ['#FFFFFF', '#F0FDF4'],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('LanguageSelection');
    }
  };

  const handleSkip = () => {
    navigation.navigate('LanguageSelection');
  };

  const slide = SLIDES[currentSlide];

  return (
    <LinearGradient colors={slide.colors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <AppText style={styles.skipText}>{t('onboarding.skip')}</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={slide.iconName} size={80} color="#16A34A" />
          </View>
          <AppText style={styles.title}>{t(slide.titleKey)}</AppText>
          <AppText style={styles.description}>{t(slide.descKey)}</AppText>
        </View>

        <View style={styles.footer}>
          {/* Indicators */}
          <View style={styles.indicatorContainer}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentSlide ? styles.activeIndicator : null,
                ]}
              />
            ))}
          </View>

          {/* Button */}
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <AppText style={styles.buttonText}>
              {currentSlide === SLIDES.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 5,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#16A34A',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#16A34A',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
