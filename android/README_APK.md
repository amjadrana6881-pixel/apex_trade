# 📱 WyseTrade Android Native App (Live OTA Sync)

This Android project is built with **Dynamic Remote Bridge Architecture**.

## 🌟 Why Users Never Need to Re-download / Reinstall the APK

> **How it works:**
> The Native Android APK is configured with a high-performance **Hardware-Accelerated Web Engine** pointing to your live server endpoint.
>
> 1. When you deploy updates to your web frontend (new trading options, buttons, colors, charts) or make changes in the **Admin Dashboard** (balance additions, new investment packages, spin prizes, announcements), **they reflect immediately on all users' Android phones!**
> 2. The user **never has to uninstall or re-download** the APK file from the store or website.
> 3. Native hardware acceleration, file/camera upload for deposits & KYC, and Android back button handling are all pre-configured natively.

---

## ⚙️ How to Point to Your Production Domain

When you deploy your backend and web client to your production server/domain (e.g. `https://www.wysetrade.net`):

1. Open `android/app/src/main/java/net/wysetrade/app/MainActivity.java`
2. Change the `APP_URL` variable:
   ```java
   private static final String APP_URL = "https://www.wysetrade.net";
   ```
3. In `android/capacitor.config.json`, update:
   ```json
   "server": {
     "url": "https://www.wysetrade.net"
   }
   ```

---

## 🔨 How to Build the APK File

### Option 1: Using Android Studio (Recommended & Easiest)
1. Open **Android Studio**.
2. Click **File -> Open...** and select the `/Users/apple/Desktop/trade/android` folder.
3. Wait for Gradle sync to complete.
4. Click on the top menu: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
5. In 1–2 minutes, Android Studio will display a notification: `"APK(s) generated successfully: locate"`.
6. Click **locate** to find your ready-to-install `.apk` file!

### Option 2: Using Command Line
Run the provided build script:
```bash
cd /Users/apple/Desktop/trade/android
./build_apk.sh
```
The output `.apk` file will be generated in `app/build/outputs/apk/debug/` or `app/build/outputs/apk/release/`.
