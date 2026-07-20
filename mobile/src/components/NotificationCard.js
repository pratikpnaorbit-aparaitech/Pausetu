import React, { useRef } from 'react';
import { StyleSheet, View, Animated, PanResponder, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80; // Swipe threshold to show delete button

export default function NotificationCard({ item, onMarkAsRead, onDelete }) {
  const { t } = useTranslation();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only set responder if moving left horizontally
        return Math.abs(gestureState.dx) > 10 && gestureState.dx < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping to the left, up to a limit
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Snap open
          Animated.spring(translateX, {
            toValue: -90,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        } else {
          // Snap closed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#EF4444'; // Red accent
      case 'Medium':
        return '#F59E0B'; // Orange accent
      case 'Low':
      default:
        return '#16A34A'; // Green accent
    }
  };

  const handlePressCard = () => {
    // Snap closed first
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    onMarkAsRead(item.id);
  };

  return (
    <View style={styles.container}>
      {/* Background Delete Button Layer */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <AppText style={styles.deleteText}>{t('notificationCard.delete')}</AppText>
        </TouchableOpacity>
      </View>

      {/* Foreground Sliding Card Layer */}
      <Animated.View
        style={[
          styles.cardFrame,
          { transform: [{ translateX }] },
          !item.isRead && styles.unreadCardBorder,
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.95} style={styles.cardTouchArea} onPress={handlePressCard}>
          {/* Priority border strip */}
          <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(item.priority) }]} />

          {/* Icon Section */}
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '12' }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
            </View>

            {/* Notification Text content */}
            <View style={styles.textWrapper}>
              <View style={styles.titleRow}>
                <AppText style={[styles.cardTitle, !item.isRead && styles.unreadTitleText]} numberOfLines={1}>
                  {item.title}
                </AppText>
                {!item.isRead && <View style={styles.unreadGreenDot} />}
              </View>

              <AppText style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </AppText>

              <View style={styles.metaRow}>
                <AppText style={styles.cardTime}>{item.time}</AppText>
                {item.badgeText && (
                  <View style={[styles.statusBadge, { backgroundColor: item.badgeColor }]}>
                    <AppText style={[styles.statusBadgeText, { color: item.badgeTextColor }]}>
                      {item.badgeText}
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#EF4444', // Red backdrop matching delete buttons background
    overflow: 'hidden',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: '#EF4444',
  },
  deleteButton: {
    width: 90,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  cardFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCardBorder: {
    borderColor: '#DCFCE7',
  },
  cardTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
  },
  priorityStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  unreadTitleText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
