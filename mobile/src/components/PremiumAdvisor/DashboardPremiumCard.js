import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';
import PremiumBadge from './PremiumBadge';

export default function DashboardPremiumCard({ isPremium, onPress }) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      <LinearGradient
        colors={isPremium ? ['#7F00FF', '#E100FF'] : ['#1e1b4b', '#312e81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons 
              name={isPremium ? "robot-happy" : "robot-vacuum-variant"} 
              size={24} 
              color="#F59E0B" 
              style={styles.robotIcon} 
            />
            <AppText style={styles.title}>
              {t('premiumAdvisor.lockScreen.title')}
            </AppText>
          </View>
          {isPremium ? (
            <PremiumBadge />
          ) : (
            <View style={styles.freeBadge}>
              <AppText style={styles.freeText}>AI Care</AppText>
            </View>
          )}
        </View>

        <AppText style={styles.description}>
          {isPremium 
            ? t('premiumAdvisor.chatbot.subtitle') 
            : t('premiumAdvisor.lockScreen.subtitle')
          }
        </AppText>

        <View style={styles.footer}>
          <AppText style={styles.actionText}>
            {isPremium 
              ? t('common.continue') 
              : t('premiumAdvisor.lockScreen.unlockBtn')
            }
          </AppText>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    borderRadius: 20,
    shadowColor: '#7F00FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  robotIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  freeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  freeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18.5,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  }
});
