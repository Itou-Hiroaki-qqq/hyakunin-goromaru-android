// expo-av モック
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          stopAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
          setOnPlaybackStatusUpdate: jest.fn(),
        },
        status: {},
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
}));

// expo-sqlite モック
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  }),
  SQLiteDatabase: jest.fn(),
}));

// expo-secure-store モック
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// expo-notifications モック
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// expo-file-system モック
jest.mock('expo-file-system', () => ({
  cacheDirectory: '/mock/cache/',
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue({ uri: '/mock/cache/file', status: 200 }),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

// react-native-reanimated モック
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// expo-router モック
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
}));

// @tanstack/react-query モック（コンポーネントテスト用）
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: undefined, isLoading: false, error: null })),
  useMutation: jest.fn(() => ({ mutate: jest.fn(), isLoading: false })),
  QueryClient: jest.fn().mockImplementation(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
