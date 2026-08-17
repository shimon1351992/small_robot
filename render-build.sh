#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Render Build for small_robot server..."

# 1. Install Node dependencies
npm install

# 2. Download and install arduino-cli for Linux
mkdir -p ./server/bin
if [ ! -f ./server/bin/arduino-cli ]; then
  echo "📦 Downloading arduino-cli for Linux..."
  curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=./server/bin sh
fi

# 3. Setup arduino-cli configuration and ESP32 board support
export PATH="$(pwd)/server/bin:$PATH"
./server/bin/arduino-cli config init --overwrite || true
./server/bin/arduino-cli config set board_manager.additional_urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
./server/bin/arduino-cli core update-index
echo "⚡ Installing ESP32 Board Core (this enables cloud compilation)..."
./server/bin/arduino-cli core install esp32:esp32

echo "🔥 Pre-warming ESP32 Core cache (speeds up student flashing to 2 seconds)..."
mkdir -p ./server/arduino_cache
mkdir -p ./server/arduino_temp/warmup
echo "void setup(){} void loop(){}" > ./server/arduino_temp/warmup/warmup.ino
./server/bin/arduino-cli compile --fqbn esp32:esp32:esp32 --build-cache-path ./server/arduino_cache ./server/arduino_temp/warmup || true
rm -rf ./server/arduino_temp/warmup

echo "✅ Render Build Finished Successfully!"

