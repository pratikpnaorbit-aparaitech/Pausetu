import React, { useState, useContext, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Animated, Easing, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import AppText from './AppText';

const LANGUAGES = [
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'en', label: 'English' },
];

export default function LanguageSelector({ style }) {
  const { language, changeAppLanguage } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Default to mr if language is undefined
  const currentLang = LANGUAGES.find(l => l.code === (language || 'mr')) || LANGUAGES[0];

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleSelect = (code) => {
    if (code !== language) {
      changeAppLanguage(code);
    }
    setIsOpen(false);
  };

  const translateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0]
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.selectorButton} 
        activeOpacity={0.7} 
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="language" size={16} color="#16A34A" style={styles.icon} />
        <AppText style={styles.selectedText}>{currentLang.label}</AppText>
        <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <Pressable>
              <Animated.View style={[
                styles.dropdownMenu,
                {
                  opacity: dropdownAnim,
                  transform: [{ translateY }]
                }
              ]}>
                {LANGUAGES.map((lang, index) => {
                  const isSelected = lang.code === currentLang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.dropdownItem,
                        index < LANGUAGES.length - 1 && styles.dropdownItemBorder
                      ]}
                      onPress={() => handleSelect(lang.code)}
                      activeOpacity={0.7}
                    >
                      <AppText style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextSelected
                      ]}>
                        {lang.label}
                      </AppText>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#16A34A" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  icon: {
    marginRight: 4,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    marginRight: 2,
    ...Platform.select({
      ios: { marginTop: 2 },
      android: { marginTop: 1 },
      web: { marginTop: 0 }
    })
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 95 : 60,
    paddingRight: 16,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      }
    }),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#16A34A',
    fontWeight: '700',
  }
});
