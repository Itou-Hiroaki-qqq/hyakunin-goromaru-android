import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/study';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

/**
 * 画面ヘッダーコンポーネント
 */
const Header = memo(({ title, showBack = false, rightElement }: HeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="戻る"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {rightElement ? (
        <View style={styles.rightContainer}>{rightElement}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
});

Header.displayName = 'Header';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    minHeight: 54,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.surface,
    fontWeight: '300',
    lineHeight: 28,
  },
  placeholder: {
    minWidth: 36,
  },
  rightContainer: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
});

export default Header;
