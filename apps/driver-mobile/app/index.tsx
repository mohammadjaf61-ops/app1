import { View, Text, StyleSheet } from 'react-native';

import { fontHeading, fontBody } from '../theme/typography';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>سائق التوصيل</Text>
      <Text style={styles.subtitle}>تطبيق قيد التطوير</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: fontHeading,
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontBody,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
