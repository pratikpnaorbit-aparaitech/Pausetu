/**
 * FilterBottomSheet.js
 * Premium Farmer-Friendly Filter bottom sheet in Marathi for PashuSetu
 *
 * UI-only component. No filtering logic, no API calls.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Modal,
  Dimensions,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.9;
const DISMISS_THRESHOLD = 80;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FilterBottomSheet({ visible, onClose, onApply, initialFilters }) {
  const { t } = useTranslation();

  const LIVESTOCK_CATEGORIES = [
    { id: 'all',     label: t('filter.allAnimals'),       image: require('../../assets/icons/all.png') },
    { id: 'cow',     label: t('filter.cow'),       image: require('../../assets/icons/cow.png') },
    { id: 'buffalo', label: t('filter.buffalo'),      image: require('../../assets/icons/buffalo.png') },
    { id: 'goat',    label: t('filter.goat'),      image: require('../../assets/icons/goat.png') },
    { id: 'sheep',   label: t('filter.sheep'),      image: require('../../assets/icons/sheep.png') },
    { id: 'horse',   label: t('filter.horse'),      image: require('../../assets/icons/horse.png') },
    { id: 'other',   label: t('filter.other'),       image: require('../../assets/icons/other.png') },
  ];

  const BUDGET_OPTIONS = [
    { id: 'any',       label: t('filter.anyBudget') },
    { id: '0-20k',     label: t('filter.upTo20k') },
    { id: '20-50k',    label: t('filter.20To50k') },
    { id: '50-1L',     label: t('filter.50kTo1L') },
    { id: '1-2L',      label: t('filter.1LTo2L') },
    { id: '2L+',       label: t('filter.above2L') },
  ];

  const DISTANCE_OPTIONS = [
    { id: 'any',  label: t('filter.anyDistance') },
    { id: '5',    label: t('filter.5km') },
    { id: '10',   label: t('filter.10km') },
    { id: '20',   label: t('filter.20km') },
    { id: '50',   label: t('filter.50km') },
  ];

  const GENDERS = [
    { id: 'any',    label: t('filter.allGenders') },
    { id: 'male',   label: t('filter.male') },
    { id: 'female', label: t('filter.female') },
  ];

  const AGES = [
    { id: 'any',  label: t('filter.anyAge') },
    { id: '0-2',  label: t('filter.under2Years') },
    { id: '1-3',  label: t('filter.1To3Years') },
    { id: '3-5',  label: t('filter.3To5Years') },
    { id: '5+',   label: t('filter.above5Years') },
  ];

  const MILK_YIELDS = [
    { id: 'any',  label: t('filter.anyMilk') },
    { id: '0-5',  label: t('filter.upTo5L') },
    { id: '5-10', label: t('filter.5To10L') },
    { id: '10+',  label: t('filter.above10L') },
  ];

  const BREEDS_MAP = {
    cow: [t('filter.allBreeds'), t('filter.gir'), t('filter.sahiwal'), t('filter.khillar'), t('filter.hf'), t('filter.jersey'), t('filter.other')],
    buffalo: [t('filter.allBreeds'), t('filter.murrah'), t('filter.jaffarabadi'), t('filter.pandharpuri'), t('filter.mehsana'), t('filter.other')],
    goat: [t('filter.allBreeds'), t('filter.osmanabadi'), t('filter.sirohi'), t('filter.jamunapari'), t('filter.beetal'), t('filter.other')],
    sheep: [t('filter.allBreeds'), t('filter.deccani'), t('filter.nellore'), t('filter.madgyal'), t('filter.other')],
    horse: [t('filter.allBreeds'), t('filter.marwari'), t('filter.kathiawadi'), t('filter.nukra'), t('filter.other')],
  };

  // UI Selection States
  const [selectedCat,    setSelectedCat]    = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('any');
  const [selectedDist,   setSelectedDist]   = useState('any');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Expanded fields
  const [selectedGender, setSelectedGender] = useState('any');
  const [selectedAge,    setSelectedAge]    = useState('any');
  const [selectedBreed,  setSelectedBreed]  = useState(t('filter.allBreeds'));
  const [selectedMilk,   setSelectedMilk]   = useState('any');

  // Animation values
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Sync state with initialFilters when opening
  useEffect(() => {
    if (visible) {
      setSelectedCat(initialFilters?.category || 'all');
      setSelectedBudget(initialFilters?.budget || 'any');
      setSelectedDist(initialFilters?.distance || 'any');
      setSelectedGender(initialFilters?.gender || 'any');
      setSelectedAge(initialFilters?.age || 'any');
      setSelectedBreed(initialFilters?.breed || t('filter.allBreeds'));
      setSelectedMilk(initialFilters?.milkYield || 'any');
    }
  }, [visible, initialFilters]);

  // Handle breed reset when category changes
  const prevCat = useRef(selectedCat);
  useEffect(() => {
    if (prevCat.current !== selectedCat && visible) {
      setSelectedBreed(t('filter.allBreeds'));
    }
    prevCat.current = selectedCat;
  }, [selectedCat, visible]);

  // Open/Close transition
  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_H,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Drag Gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD) {
          onClose();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  const handleReset = () => {
    setSelectedCat('all');
    setSelectedBudget('any');
    setSelectedDist('any');
    setSelectedGender('any');
    setSelectedAge('any');
    setSelectedBreed(t('filter.allBreeds'));
    setSelectedMilk('any');
    setIsAdvancedOpen(false);
    if (onApply) {
      onApply({
        category: 'all',
        budget: 'any',
        distance: 'any',
        gender: 'any',
        age: 'any',
        breed: t('filter.allBreeds'),
        milkYield: 'any',
      });
    }
    onClose();
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        category: selectedCat,
        budget: selectedBudget,
        distance: selectedDist,
        gender: selectedGender,
        age: selectedAge,
        breed: selectedBreed,
        milkYield: selectedMilk,
      });
    }
    onClose();
  };

  const toggleAdvanced = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAdvancedOpen(!isAdvancedOpen);
  };

  const showMilkFilter = selectedCat === 'cow' || selectedCat === 'buffalo';
  const breedsList = BREEDS_MAP[selectedCat] || [];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Background Dim */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Main Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: Animated.add(translateY, dragY) }] },
        ]}
      >
        {/* Drag handle / Header */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View>
              <AppText style={styles.headerTitle}>{t('filter.whatDoYouWant')}</AppText>
              <AppText style={styles.headerSubtitle}>{t('filter.searchByNeeds')}</AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Scrollable Container */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 🐄 कोणतं जनावर? */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>{t('filter.whichAnimal')}</AppText>
            <View style={styles.grid}>
              {LIVESTOCK_CATEGORIES.map((cat) => {
                const isSelected = selectedCat === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catCard, isSelected && styles.catCardSelected]}
                    onPress={() => setSelectedCat(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Image source={cat.image} style={styles.catImage} resizeMode="contain" />
                    <AppText style={[styles.catLabel, isSelected && styles.catLabelSelected]}>
                      {cat.label}
                    </AppText>
                    {isSelected && (
                      <View style={styles.checkedCircle}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 💰 तुमचं बजेट किती? */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>{t('filter.whatsYourBudget')}</AppText>
            <View style={styles.budgetGrid}>
              {BUDGET_OPTIONS.map((opt) => {
                const isSelected = selectedBudget === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.budgetCard, isSelected && styles.budgetCardSelected]}
                    onPress={() => setSelectedBudget(opt.id)}
                    activeOpacity={0.8}
                  >
                    <AppText style={[styles.budgetLabel, isSelected && styles.budgetLabelSelected]}>
                      {opt.label}
                    </AppText>
                    <AppText style={[styles.budgetDesc, isSelected && styles.budgetDescSelected]}>
                      {opt.desc}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 📍 कुठे पाहिजे? */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>{t('filter.howFar')}</AppText>
            <View style={styles.distGrid}>
              {DISTANCE_OPTIONS.map((opt) => {
                const isSelected = selectedDist === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.distCard, isSelected && styles.distCardSelected]}
                    onPress={() => setSelectedDist(opt.id)}
                    activeOpacity={0.8}
                  >
                    <AppText style={[styles.distLabel, isSelected && styles.distLabelSelected]}>
                      {opt.label}
                    </AppText>
                    <AppText style={[styles.distDesc, isSelected && styles.distDescSelected]}>
                      {opt.desc}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ⚙️ आणखी पर्याय (Accordion) */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.accordionHeader} onPress={toggleAdvanced} activeOpacity={0.8}>
              <View style={styles.accordionHeaderLeft}>
                <View style={[styles.settingsIconBox, isAdvancedOpen && styles.settingsIconBoxActive]}>
                  <MaterialCommunityIcons name="tune-variant" size={20} color={isAdvancedOpen ? '#16A34A' : '#64748B'} />
                </View>
                <AppText style={styles.accordionTitle}>{t('filter.moreOptions')}</AppText>
              </View>
              <Ionicons
                name={isAdvancedOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>

            {isAdvancedOpen && (
              <View style={styles.advancedContainer}>

                {/* जात (Breed) */}
                {breedsList.length > 0 && (
                  <View style={styles.subSection}>
                    <AppText style={styles.subTitle}>{t('filter.selectBreed')}</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                      {breedsList.map((br) => {
                        const isSelected = selectedBreed === br;
                        return (
                          <TouchableOpacity
                            key={br}
                            style={[styles.miniChip, isSelected && styles.miniChipSelected]}
                            onPress={() => setSelectedBreed(br)}
                          >
                            <AppText style={[styles.miniChipText, isSelected && styles.miniChipTextSelected]}>
                              {br}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* नर / मादी */}
                <View style={styles.subSection}>
                  <AppText style={styles.subTitle}>{t('filter.maleOrFemale')}</AppText>
                  <View style={styles.chipRow}>
                    {GENDERS.map((g) => {
                      const isSelected = selectedGender === g.id;
                      return (
                        <TouchableOpacity
                          key={g.id}
                          style={[styles.miniChip, isSelected && styles.miniChipSelected]}
                          onPress={() => setSelectedGender(g.id)}
                        >
                          <AppText style={[styles.miniChipText, isSelected && styles.miniChipTextSelected]}>
                            {g.label}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* वय */}
                <View style={styles.subSection}>
                  <AppText style={styles.subTitle}>{t('filter.whatAge')}</AppText>
                  <View style={styles.chipRow}>
                    {AGES.map((a) => {
                      const isSelected = selectedAge === a.id;
                      return (
                        <TouchableOpacity
                          key={a.id}
                          style={[styles.miniChip, isSelected && styles.miniChipSelected]}
                          onPress={() => setSelectedAge(a.id)}
                        >
                          <AppText style={[styles.miniChipText, isSelected && styles.miniChipTextSelected]}>
                            {a.label}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* दूध उत्पादन (dairy animals only) */}
                {showMilkFilter && (
                  <View style={styles.subSection}>
                    <AppText style={styles.subTitle}>{t('filter.milkProduction')}</AppText>
                    <View style={styles.chipRow}>
                      {MILK_YIELDS.map((m) => {
                        const isSelected = selectedMilk === m.id;
                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={[styles.miniChip, isSelected && styles.miniChipSelected]}
                            onPress={() => setSelectedMilk(m.id)}
                          >
                            <AppText style={[styles.miniChipText, isSelected && styles.miniChipTextSelected]}>
                              {m.label}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

              </View>
            )}
          </View>

          {/* Footer spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Sticky Action Buttons */}
        <View style={styles.stickyFooter}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.75}>
            <AppText style={styles.resetBtnText}>{t('filter.clear')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Ionicons name="search" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <AppText style={styles.applyBtnText}>{t('filter.showAnimals')}</AppText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_H,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  dragArea: {
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },

  // Category Grid (Large selectable cards with Image + Name)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '31.5%',
    aspectRatio: 0.95,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    position: 'relative',
  },
  catCardSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  catImage: {
    width: '52%',
    height: '52%',
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  catLabelSelected: {
    color: '#15803D',
  },
  checkedCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Budget selection list
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  budgetCardSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  budgetLabelSelected: {
    color: '#15803D',
  },
  budgetDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  budgetDescSelected: {
    color: '#16A34A',
  },

  // Distance selection list
  distGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distCard: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  distCardSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  distLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  distLabelSelected: {
    color: '#15803D',
  },
  distDesc: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  distDescSelected: {
    color: '#16A34A',
  },

  // Accordion Advanced Settings Header
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIconBoxActive: {
    backgroundColor: '#DCFCE7',
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },

  // Advanced settings contents
  advancedContainer: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  subSection: {
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  horizontalScroll: {
    gap: 6,
    paddingRight: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  miniChipSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  miniChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  miniChipTextSelected: {
    color: '#FFFFFF',
  },

  // Sticky bottom action bar
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  applyBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
