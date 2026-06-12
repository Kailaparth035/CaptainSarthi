#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/run-ios-simulator.sh "iPhone 16 Pro"
#        ./scripts/run-ios-simulator.sh "iPad Pro 13-inch (M5)"

DEVICE_NAME="${1:-iPhone 16 Pro}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Looking for simulator: ${DEVICE_NAME}"

# Prefer an already booted device with this name, otherwise the first available match.
UDID="$(
  xcrun simctl list devices 2>/dev/null \
    | grep -F "${DEVICE_NAME} (" \
    | grep Booted \
    | head -1 \
    | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' \
    || true
)"

if [ -z "${UDID}" ]; then
  UDID="$(
    xcrun simctl list devices available 2>/dev/null \
      | grep -F "${DEVICE_NAME} (" \
      | head -1 \
      | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/'
  )"
fi

if [ -z "${UDID}" ]; then
  echo "Simulator '${DEVICE_NAME}' was not found."
  echo "Available simulators:"
  xcrun simctl list devices available 2>/dev/null | grep -E "iPhone|iPad" || true
  exit 1
fi

echo "Using simulator UDID: ${UDID}"

# Open Simulator app so the window is visible.
open -a Simulator

# Boot the target simulator if needed.
if ! xcrun simctl list devices 2>/dev/null | grep "${UDID}" | grep -q Booted; then
  echo "Booting simulator..."
  xcrun simctl boot "${UDID}" || true
fi

# Focus the selected device in Simulator.
xcrun simctl bootstatus "${UDID}" -b

echo "Building and launching on ${DEVICE_NAME}..."
npx react-native run-ios --udid "${UDID}"
