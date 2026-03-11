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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/constants/study';

/**
 * ユーザー登録画面
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { login: setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('入力エラー', 'すべての項目を入力してください');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('入力エラー', '有効なメールアドレスを入力してください');
      return;
    }

    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上で入力してください');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('入力エラー', 'パスワードが一致しません');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await setAuth(response.token, response.user);
      router.replace('/');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      let message = '登録に失敗しました。入力内容を確認してください。';
      if (status === 409) {
        message = 'このメールアドレスは既に登録されています。';
      } else if (status === 429) {
        message = 'アクセスが集中しています。しばらくしてからお試しください。';
      } else if (status === 500) {
        message = 'サーバーエラーが発生しました。しばらくしてからお試しください。';
      }
      Alert.alert('登録エラー', message);
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>アカウント作成</Text>
            <Text style={styles.subtitle}>百人一首 ゴロでマル覚え</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>ユーザー名</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="あなたのニックネーム"
              autoCorrect={false}
            />

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

            <Text style={styles.label}>パスワード（確認）</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="パスワードを再入力"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.disabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <Text style={styles.registerButtonText}>登録する</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginLinkText}>すでにアカウントをお持ちの方</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.back()}
            >
              <Text style={styles.backLinkText}>登録せずに続ける</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: COLORS.surface,
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  loginLink: {
    alignItems: 'center',
    padding: 12,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    padding: 8,
    marginBottom: 32,
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
