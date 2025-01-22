import React, { useState, useEffect } from "react";
import { Platform, View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import * as SplashScreen from "expo-splash-screen";

import AndroidApp from "./Components/AndroidPlatform/PlatformSpecificApp.android";
import WebApp from "./Components/WebPlatform/PlatformSpecificApp.web";

const PlatformSpecificApp = Platform.select({
  android: AndroidApp,
  web: WebApp,
  default: WebApp,
});

export default function App() {
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  const handleAnimationFinish = async () => {
    setIsAnimationDone(true);
    await SplashScreen.hideAsync();
  };

  if (!isAnimationDone) {
    return (
      <View style={styles.splashContainer}>
        <LottieView
          source={require("./assets/book.json")}
          autoPlay
          loop={false}
          onAnimationFinish={handleAnimationFinish}
        />
      </View>
    );
  }


  return <PlatformSpecificApp />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff", // Match your app's theme or splash screen background color
  },
});
