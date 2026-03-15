import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24 }}>Hello World</Text>
    </View>
  );
}
