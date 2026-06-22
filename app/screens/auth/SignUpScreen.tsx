import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { supabase } from '../../db/supabase';
import type { MoreStackParamList } from '../../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'SignUp'>;

export function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password) { Alert.alert('Error', 'Enter email and password.'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) { Alert.alert('Sign Up Failed', error.message); return; }
    Alert.alert(
      'Check Your Email',
      'We sent a confirmation link to your email. Click it to activate your account, then sign in.',
      [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
        <View style={s.container}>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Free account — required only to post Community Alerts. All other features work without an account.</Text>

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

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Min. 6 characters"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={s.label}>Confirm Password</Text>
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Re-enter password"
            placeholderTextColor={Colors.textMuted}
          />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.textOnPrimary} /> : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={s.switchRow}>
            <Text style={s.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={s.switchLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 32 },
  label: { color: Colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.surfaceBorder,
    color: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16,
  },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20, marginTop: 8 },
  btnDisabled: { backgroundColor: Colors.textMuted },
  btnText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchText: { color: Colors.textSecondary, fontSize: 14 },
  switchLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
