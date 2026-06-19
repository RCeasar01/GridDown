import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  editable?: boolean;
  autoFocus?: boolean;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  onPress,
  placeholder = 'Search guides, skills, topics...',
  editable = true,
  autoFocus = false,
  onClear,
}: SearchBarProps) {
  if (!editable && onPress) {
    // Tappable preview mode (HomeScreen)
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value && value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    padding: 0,
  },
  placeholder: {
    color: Colors.textMuted,
    fontSize: 15,
    flex: 1,
  },
});
