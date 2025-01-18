import React from "react";
import { StyleSheet, Text, View, Button, TextInput } from "react-native";

export default function PlatformSpecificApp() {
  return (
    <View style={styles.appContainer}>
      <View>
        <TextInput placeholder="Your goal!" />
        <Button title="Add new goal" onPress={() => {}} />
      </View>
      <Text>List of goals...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    padding: 50,
  },
});
