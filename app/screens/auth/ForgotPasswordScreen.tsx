import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { supabase } from '../../db/supabase';

export function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Enter your email address.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <Text style={s.icon}>📧</Text>
          <Text style={s.title}>Check Your Email</Text>
          <Text style={s.subtitle}>We sent a password reset link to{'\n'}{email.trim()}</Text>
          <Text style={s.note}>Follow the link in the email to set a new password. Then return here to sign in.</Text>
          <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}>
            <Text style={s.btnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
        <View style={s.container}>
          <Text style={s.title}>Reset Password</Text>
          <Text style={s.subtitle}>Enter your account email and we'll send a reset link.</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
          />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.textOnPrimary} /> : <Text style={s.btnText}>Send Reset Link</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backLink}>
            <Text style={s.backText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 32 },
  note: { color: Colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 24 },
  label: { color: Colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.surfaceBorder,
    color: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16,
  },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { backgroundColor: Colors.textMuted },
  btnText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '800' },
  backLink: { alignItems: 'center' },
  backText: { color: Colors.primary, fontSize: 14 },
});
