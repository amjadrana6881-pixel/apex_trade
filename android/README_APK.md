# 📱 ApexTrade PRO Android Native App (Live OTA Sync & Animated Splash)

This Android project is built with **Dynamic Remote Bridge Architecture & Native Hardware Accelerated Engine**.

## 🌟 Key Features
1. **Animated Native Splash Screen**:
   - Glowing pulsing logo animation (`anim/pulse.xml`)
   - Smooth slide-up branding typography and real-time status indicator
   - Hardware accelerated transition into live trading desk
2. **Instant Real-Time Sync**:
   - Any updates deployed to Netlify (new signal times, buttons, color themes, payout networks) reflect immediately on the Android APK without reinstalling!
3. **Camera & Storage Permissions**:
   - Full support for deposit receipt uploads and KYC document capture directly from phone.

---

## ⚙️ How to Point to Your Live Netlify Domain

When your app is live on Netlify (e.g. `https://your-apextrade.netlify.app` or `https://www.apextrade.net`):

1. Open `android/app/src/main/java/net/wysetrade/app/MainActivity.java`
2. Update line 36 `APP_URL`:
   ```java
   private static final String APP_URL = "https://your-apextrade.netlify.app";
   ```
3. In `android/capacitor.config.json`, update:
   ```json
   "server": {
     "url": "https://your-apextrade.netlify.app"
   }
   ```

---

## 🔨 How to Build the APK File

### Option 1: Using Android Studio (Recommended & Easiest)
1. Open **Android Studio**.
2. Click **File -> Open...** and select the `/Users/apple/Desktop/trade/android` folder.
3. Wait for Gradle sync to complete.
4. Click on top menu: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
5. In 1–2 minutes, Android Studio will notify: `"APK(s) generated successfully: locate"`.
6. Click **locate** to get your ready-to-install `.apk` file!

### Option 2: Using Command Line
Run the build script:
```bash
cd /Users/apple/Desktop/trade/android
./build_apk.sh
```
The output `.apk` file will be generated in `app/build/outputs/apk/debug/app-debug.apk`.
