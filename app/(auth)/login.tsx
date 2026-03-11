import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/constants/study';

/**
 * ログイン画面
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login: setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('入力エラー', '有効なメールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      await setAuth(response.token, response.user);
      router.replace('/');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      let message = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
      if (status === 429) {
        message = 'アクセスが集中しています。しばらくしてからお試しください。';
      } else if (status === 500) {
        message = 'サーバーエラーが発生しました。しばらくしてからお試しください。';
      }
      Alert.alert('ログインエラー', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>ログイン</Text>
          <Text style={styles.subtitle}>百人一首 ゴロでマル覚え</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>パスワード</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="6文字以上"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.loginButtonText}>ログイン</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerLinkText}>アカウントを作成する</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>ログインせずに続ける</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: COLORS.surface,
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  registerLink: {
    alignItems: 'center',
    padding: 12,
  },
  registerLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    padding: 8,
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
