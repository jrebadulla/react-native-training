import ShelfMiniMap from "./ShelfMiniMap ";
import { LinearGradient } from "expo-linear-gradient";
import { View, StyleSheet } from "react-native";

export default function PlatformSpecificApp() {
  return (
    <LinearGradient colors={["#6D2323", "#d4a373"]} style={styles.container}>
      <View style={styles.centered}>
        <ShelfMiniMap />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    marginTop: 100,
    width: "100%",
    alignItems: "center",
  },
});
