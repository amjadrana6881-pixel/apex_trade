#!/bin/bash
set -e

if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
elif [ -d "/usr/local/Cellar/openjdk@21" ]; then
  export JAVA_HOME="/usr/local/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home"
fi
export PATH="${JAVA_HOME}/bin:${PATH}"
export ANDROID_HOME="/Users/apple/Library/Android/sdk"

echo "🚀 Building ApexTrader Pro User and Admin Android APKs..."

PROJECT_ROOT="$(pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/public/downloads"
mkdir -p "${OUTPUT_DIR}"

# 0. Generate fresh icons
echo "🎨 [0/2] Syncing Android icon assets across all mipmaps..."
node "${PROJECT_ROOT}/scripts/generate_android_icons.js"

# 1. Build User APK
echo "📱 [1/2] Building ApexTrader Pro User APK (com.apextrade.user)..."
cd "${PROJECT_ROOT}/android-user"
./gradlew assembleDebug --stacktrace
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrader_Pro.apk"
echo "✅ User APK built successfully -> public/downloads/ApexTrader_Pro.apk"

# 2. Build Admin APK
echo "🛡️ [2/2] Building ApexTrader Admin APK (com.apextrade.admin)..."
cd "${PROJECT_ROOT}/android-admin"
./gradlew assembleDebug --stacktrace
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrader_Admin.apk"
echo "✅ Admin APK built successfully -> public/downloads/ApexTrader_Admin.apk"

echo "🎉 ONLY 2 OFFICIAL APKS IN public/downloads/:"
ls -lh "${OUTPUT_DIR}"/*.apk

