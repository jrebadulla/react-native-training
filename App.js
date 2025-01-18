import { Platform } from "react-native";

import AndroidApp from "./Components/AndroidPlatform/PlatformSpecificApp.android";
import WebApp from "./Components/WebPlatform/PlatformSpecificApp.web";

const PlatformSpecificApp = Platform.select({
  android: AndroidApp,
  web: WebApp,
  default: WebApp,
});

export default function App() {
  return <PlatformSpecificApp />;
}
