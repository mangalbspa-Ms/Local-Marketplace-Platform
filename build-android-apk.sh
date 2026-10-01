#!/usr/bin/env bash
set -e

echo "=== [1/6] Verifying Web Build and Lint ==="
npm run lint
npm run build

echo "=== [2/6] Ensuring Java 21 is Installed ==="
if ! command -v javac &> /dev/null || ! javac -version 2>&1 | grep -q "21\."; then
  echo "Installing OpenJDK 21..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y --no-install-recommends -o Dpkg::Options::="--force-confold" -o Dpkg::Options::="--force-confdef" openjdk-21-jdk-headless unzip wget
fi

java -version
javac -version

echo "=== [3/6] Setting up Android SDK Command-Line Tools & Platforms ==="
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

if [ ! -f "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  cd "$ANDROID_HOME/cmdline-tools"
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
  unzip -q cmdline-tools.zip
  rm -rf latest
  mv cmdline-tools latest
  rm -f cmdline-zip cmdline-tools.zip
  cd - > /dev/null
fi

mkdir -p "$ANDROID_HOME/licenses"
# Accept licenses
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1 || true

# Install required platforms and build tools
if [ ! -d "$ANDROID_HOME/platforms/android-36" ] || [ ! -d "$ANDROID_HOME/build-tools/35.0.0" ]; then
  echo "Installing Android SDK packages..."
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-36" "platforms;android-35" "build-tools;35.0.0" "build-tools;34.0.0"
fi

echo "sdk.dir=$ANDROID_HOME" > android/local.properties

echo "=== [4/6] Syncing Web Assets into Capacitor Android Project ==="
npx cap sync android

echo "=== [5/6] Assembling Android APK ==="
cd android
chmod +x gradlew
GRADLE_BIN=$(find /root/.gradle/wrapper/dists -name gradle -type f -perm /111 2>/dev/null | head -n 1)
if [ -n "$GRADLE_BIN" ]; then
  echo "Using installed Gradle CLI: $GRADLE_BIN"
  "$GRADLE_BIN" assembleDebug --no-daemon --stacktrace
else
  echo "Using ./gradlew wrapper"
  ./gradlew assembleDebug --no-daemon --stacktrace
fi

echo "=== [6/6] Locating and Copying Generated APK ==="
cd ..
mkdir -p android-build
APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" | head -n 1)

if [ -f "$APK_PATH" ]; then
  cp "$APK_PATH" android-build/LocalMandi-Platform.apk
  echo "SUCCESS: APK successfully generated!"
  echo "Original APK Path: $APK_PATH"
  echo "Artifact APK Path: android-build/LocalMandi-Platform.apk"
  ls -lh "$APK_PATH"
  ls -lh android-build/LocalMandi-Platform.apk
else
  echo "ERROR: APK file was not found."
  exit 1
fi
