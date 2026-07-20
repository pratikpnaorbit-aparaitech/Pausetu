import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function ProgressIndicator({ progress }) {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  bar: {
    height: '100%',
    backgroundColor: '#10B981',
  }
});
