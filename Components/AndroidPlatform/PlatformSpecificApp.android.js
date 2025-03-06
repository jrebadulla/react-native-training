import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ShelfMiniMap from "./ShelfMiniMap";

export default function PlatformSpecificApp() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height; 

  return (
    <LinearGradient colors={["#6D2323", "#6D2323"]} style={styles.gradient}>
      <View style={styles.flexContainer}>
        {isLandscape ? (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.centered}>
              <ShelfMiniMap />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.centered}>
            <ShelfMiniMap />
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  centered: {
    marginTop: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
});
