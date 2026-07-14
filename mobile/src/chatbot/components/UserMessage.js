import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../components/AppText';

export default function UserMessage({ message }) {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <AppText style={styles.text}>{message.content}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 6,
    paddingLeft: 40,
    paddingRight: 12,
  },
  bubble: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  }
});
