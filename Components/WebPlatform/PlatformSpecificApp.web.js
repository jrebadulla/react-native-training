import React from "react";
import { StyleSheet, Text, View, Button, TextInput } from "react-native";

export default function PlatformSpecificApp() {
  return (
    <View style={styles.container}>
      <TextInput placeholder="Your course goal!" style={styles.input} />
      <Button title="Add goal" onPress={() => {}} />
      <Text>List of goals...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
});
