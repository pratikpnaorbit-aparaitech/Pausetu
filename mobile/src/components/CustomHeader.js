import React, { useContext } from 'react';
import { StyleSheet, View, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';
import AppText from './AppText';

export default function CustomHeader({
  title,
  subtitle,
  onBackPress,
  rightComponent,
  leftComponent,
  centered = true,
  backgroundColor,
  textColor,
  iconColor,
  borderBottomColor,
  showBorder = true,
  safeArea = false,
  gradientColors,
  titleStyle,
  subtitleStyle,
  style
}) {
  const { isDarkMode } = useContext(AppContext);
  const insets = useSafeAreaInsets();

  const headerTopPadding = safeArea
    ? (Platform.OS === 'android'
        ? Math.max(StatusBar.currentHeight || 0, insets.top)
        : insets.top)
    : 0;

  // Auto theme colors resolved from AppContext
  const T = isDarkMode
    ? { card: '#1E293B', text: '#F8FAFC', subText: '#94A3B8', border: '#334155' }
    : { card: '#FFFFFF', text: '#0F172A', subText: '#64748B', border: '#F1F5F9' };

  const bgCol = backgroundColor || T.card;
  const txtCol = textColor || T.text;
  const subTxtCol = T.subText;
  const icCol = iconColor || T.text;
  const bdCol = borderBottomColor || T.border;

  const HeaderContainer = gradientColors ? LinearGradient : View;
  const containerProps = gradientColors
    ? { colors: gradientColors, start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }
    : {};

  if (centered) {
    return (
      <HeaderContainer
        {...containerProps}
        style={[
          styles.header,
          !gradientColors && { backgroundColor: bgCol },
          { borderBottomColor: bdCol, paddingTop: headerTopPadding, height: 56 + headerTopPadding },
          showBorder && styles.borderBottom,
          style
        ]}
      >
        {/* Left container: Custom leftComponent, Back Button or empty spacer */}
        {leftComponent ? (
          <View style={styles.leftContainer}>
            {leftComponent}
          </View>
        ) : onBackPress ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={icCol} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sideSpacer} />
        )}

        {/* Center container: Centered Title and Subtitle */}
        <View style={styles.titleContainerCentered}>
          <AppText style={[styles.headerTitle, { color: txtCol }, titleStyle]} numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={[styles.headerSubtitle, { color: subTxtCol }, subtitleStyle]} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {/* Right container: Custom rightComponent or empty spacer */}
        {rightComponent ? (
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </HeaderContainer>
    );
  }

  // Left-aligned Title Layout (used by notifications, etc.)
  return (
    <HeaderContainer
      {...containerProps}
      style={[
        styles.header,
        !gradientColors && { backgroundColor: bgCol },
        { borderBottomColor: bdCol, paddingTop: headerTopPadding, height: 56 + headerTopPadding },
        showBorder && styles.borderBottom,
        style
      ]}
    >
      <View style={styles.leftContainerLeftAligned}>
        {leftComponent ? (
          <View style={{ marginRight: 10 }}>
            {leftComponent}
          </View>
        ) : onBackPress ? (
          <TouchableOpacity
            style={styles.backButtonLeftAligned}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={icCol} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleContainerLeftAligned}>
          <AppText style={[styles.headerTitle, { color: txtCol, textAlign: 'left' }, titleStyle]} numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={[styles.headerSubtitle, { color: subTxtCol, textAlign: 'left' }, subtitleStyle]} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      {rightComponent ? (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      ) : null}
    </HeaderContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  backButtonLeftAligned: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    marginRight: 6,
  },
  sideSpacer: {
    width: 44,
  },
  titleContainerCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  titleContainerLeftAligned: {
    justifyContent: 'center',
  },
  leftContainerLeftAligned: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 44,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 44,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
});
