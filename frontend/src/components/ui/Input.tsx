import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  hint?: string;
  error?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
  ref?: React.Ref<any>;
  rightAction?: { label: string; onPress: () => void };
}

export const Input = React.forwardRef<any, InputProps>(({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  hint,
  error,
  autoFocus,
  onSubmitEditing,
  returnKeyType,
  rightAction,
}, ref) => {
  const [secure, setSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Text style={styles.rightAction}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        ref={ref}
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        activeOutlineColor={colors.primary}
        outlineColor="transparent"
        outlineStyle={styles.outline}
        contentStyle={styles.inputContent}
        style={[styles.input, { backgroundColor: colors.primarySubtle }]}
        placeholderTextColor={colors.textPlaceholder}
        error={!!error}
        right={
          secureTextEntry ? (
            <TextInput.Icon
              icon={secure ? 'eye-off-outline' : 'eye-outline'}
              color={colors.textTertiary}
              onPress={() => setSecure(!secure)}
              size={18}
            />
          ) : undefined
        }
      />

      {hint && !error && (
        <Text style={styles.hint}>{hint}</Text>
      )}
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  rightAction: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textTertiary,
  },
  input: {
    height: 48,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  outline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  inputContent: {
    backgroundColor: colors.primarySubtle,
    borderRadius: 12,
    fontFamily: 'Inter-Regular',
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 5,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textDanger,
    marginTop: 5,
  },
});