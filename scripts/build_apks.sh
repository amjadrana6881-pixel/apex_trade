#!/bin/bash
set -e

export JAVA_HOME="/usr/local/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home"
export PATH="${JAVA_HOME}/bin:${PATH}"
export ANDROID_HOME="/Users/apple/Library/Android/sdk"

echo "🚀 Building ApexTrader Pro User and Admin Android APKs using Java 21 & Android SDK..."

PROJECT_ROOT="$(pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/public/downloads"
mkdir -p "${OUTPUT_DIR}"

# 1. Build User APK
echo "📱 [1/2] Building ApexTrader Pro User APK (com.apextrade.user)..."
cd "${PROJECT_ROOT}/android-user"
gradle assembleDebug --stacktrace
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrader_Pro.apk"
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrader_User.apk"
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrade_User.apk"
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrade.apk"
echo "✅ User APK built successfully -> public/downloads/ApexTrader_Pro.apk"

# 2. Build Admin APK
echo "🛡️ [2/2] Building ApexTrader Admin APK (com.apextrade.admin)..."
cd "${PROJECT_ROOT}/android-admin"
gradle assembleDebug --stacktrace
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrader_Admin.apk"
cp app/build/outputs/apk/debug/app-debug.apk "${OUTPUT_DIR}/ApexTrade_Admin.apk"
echo "✅ Admin APK built successfully -> public/downloads/ApexTrader_Admin.apk"

echo "🎉 ALL ANDROID APKS READY IN public/downloads/!"
