#!/bin/bash

# ==============================================================================
# WyseTrade One-Click Android APK Build Script
# ==============================================================================

set -e

echo "🚀 Starting WyseTrade Android APK Build Process..."

cd "$(dirname "$0")"

# 1. Build Client Production Bundle first
echo "📦 Step 1: Building web production assets in ../client..."
cd ../client
npm run build
cd ../android

# 2. Check if Gradle is installed
if command -v ./gradlew &> /dev/null; then
    GRADLE_CMD="./gradlew"
elif command -v gradle &> /dev/null; then
    GRADLE_CMD="gradle"
else
    echo "⚠️ Gradle not found in system PATH. You can also open the 'android' folder directly in Android Studio and click Build -> Build APK."
    exit 1
fi

echo "🔨 Step 2: Compiling Android APK with $GRADLE_CMD..."
$GRADLE_CMD assembleRelease || $GRADLE_CMD assembleDebug

echo "🎉 Build finished! APK generated in:"
find app/build/outputs/apk -name "*.apk" || echo "Check app/build/outputs/apk/ for your .apk file!"
