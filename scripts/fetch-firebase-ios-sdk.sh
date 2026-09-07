#!/usr/bin/env bash
#
# Downloads the official Firebase iOS SDK release zip from GitHub Releases
# (https://github.com/firebase/firebase-ios-sdk), verifies its checksum, and
# unpacks only the xcframeworks this extension needs into
# extensions/firebase/template/ios/firebase/Firebase/.
#
# Why this script exists (decision D1, OPENSOURCE-PLAN.md): the Firebase iOS
# SDK is ~60 MB of prebuilt xcframework binaries. Rather than committing that
# to git, this repo fetches it on demand, the same way CocoaPods/SPM would.
#
# Usage:
#   scripts/fetch-firebase-ios-sdk.sh
#
# Requires: curl, unzip, shasum. Written for the macOS-default /bin/bash
# (3.2 — no associative arrays), so it only uses plain indexed arrays.

set -euo pipefail

# ── Pinned version ───────────────────────────────────────────────────────
# How this was determined: the xcframeworks previously vendored in this
# extension's template/ios/firebase/Firebase/ directory all reported
# CFBundleShortVersionString 12.14.0 in their Info.plist (checked across 9
# different bundles: FirebaseCore, FirebaseAnalytics, FirebaseAuth,
# FirebaseCrashlytics, FirebaseMessaging, FirebaseRemoteConfig, etc.). This
# script pins that exact version and downloads that exact release asset.
FIREBASE_VERSION="12.14.0"
RELEASE_URL="https://github.com/firebase/firebase-ios-sdk/releases/download/${FIREBASE_VERSION}/Firebase.zip"
# SHA-256 of the real Firebase.zip asset for the version above, computed by
# actually downloading it and running `shasum -a 256` — not invented.
EXPECTED_SHA256="c75fc9642203689d68fff2300bc86fcce0b7db4c4589686ff1e2ce4e3057e025"

# ── Paths ─────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEST_DIR="${REPO_ROOT}/extensions/firebase/template/ios/firebase/Firebase"
WORK_DIR="$(mktemp -d)"
ZIP_PATH="${WORK_DIR}/Firebase.zip"

cleanup() { rm -rf "${WORK_DIR}"; }
trap cleanup EXIT

# ── Product pods to extract from the release zip ───────────────────────────
# Each pod directory inside Firebase.zip bundles its own copy of the
# xcframeworks it (transitively) needs; content is identical across pods for
# a shared dependency (e.g. GoogleUtilities), only the detached
# _CodeSignature differs, so picking any one copy is fine. Search order
# below is also the "first match wins" copy order.
PODS=(
    "FirebaseAnalytics"
    "FirebaseAuth"
    "FirebaseCrashlytics"
    "FirebaseMessaging"
    "FirebaseRemoteConfig"
)

# Union of xcframeworks actually used by this extension's Analytics,
# Crashlytics, RemoteConfig, Messaging and Auth clients (see
# extensions/firebase/source/BuildTaskiOS.ts REQUIRED_XCFRAMEWORKS — keep
# both lists in sync). Deliberately excludes GoogleAdsOnDeviceConversion and
# GoogleAppMeasurementIdentitySupport, which ship inside FirebaseAnalytics's
# pod directory but are not linked by this extension.
FRAMEWORKS=(
    "FBLPromises"
    "FirebaseABTesting"
    "FirebaseAnalytics"
    "FirebaseAppCheckInterop"
    "FirebaseAuth"
    "FirebaseAuthInterop"
    "FirebaseCore"
    "FirebaseCoreExtension"
    "FirebaseCoreInternal"
    "FirebaseCrashlytics"
    "FirebaseInstallations"
    "FirebaseMessaging"
    "FirebaseRemoteConfig"
    "FirebaseRemoteConfigInterop"
    "FirebaseSessions"
    "FirebaseSharedSwift"
    "GoogleAppMeasurement"
    "GoogleDataTransport"
    "GoogleUtilities"
    "GTMSessionFetcher"
    "nanopb"
    "Promises"
    "RecaptchaInterop"
)

echo "==> Firebase iOS SDK fetch: version ${FIREBASE_VERSION}"

for tool in curl unzip shasum; do
    if ! command -v "${tool}" >/dev/null 2>&1; then
        echo "error: required tool '${tool}' not found in PATH" >&2
        exit 1
    fi
done

if [ -d "${DEST_DIR}" ] && [ "$(ls -A "${DEST_DIR}" 2>/dev/null)" ]; then
    echo "==> ${DEST_DIR} already populated."
    read -r -p "    Re-download and overwrite? [y/N] " reply
    case "${reply}" in
        [yY]|[yY][eE][sS]) rm -rf "${DEST_DIR}" ;;
        *) echo "==> Skipping (nothing changed)."; exit 0 ;;
    esac
fi

echo "==> Downloading ${RELEASE_URL}"
curl -fL --progress-bar -o "${ZIP_PATH}" "${RELEASE_URL}"

echo "==> Verifying SHA-256"
ACTUAL_SHA256="$(shasum -a 256 "${ZIP_PATH}" | awk '{print $1}')"
printf '%s  %s\n' "${EXPECTED_SHA256}" "${ZIP_PATH}" | shasum -a 256 -c - >/dev/null || {
    echo "error: checksum mismatch for Firebase.zip" >&2
    echo "  expected: ${EXPECTED_SHA256}" >&2
    echo "  actual:   ${ACTUAL_SHA256}" >&2
    echo "  This can mean the release asset changed, a corrupted download, or a" >&2
    echo "  tampered file. Refusing to unpack." >&2
    exit 1
}
echo "==> Checksum OK (${EXPECTED_SHA256})"

echo "==> Extracting needed product pods"
extract_patterns=()
for pod in "${PODS[@]}"; do
    extract_patterns+=("Firebase/${pod}/*")
done
( cd "${WORK_DIR}" && unzip -q "${ZIP_PATH}" "${extract_patterns[@]}" )

mkdir -p "${DEST_DIR}"

echo "==> Copying $(printf '%s\n' "${FRAMEWORKS[@]}" | wc -l | tr -d ' ') xcframeworks into ${DEST_DIR}"
missing=()
for fw in "${FRAMEWORKS[@]}"; do
    found=""
    for pod in "${PODS[@]}"; do
        src="${WORK_DIR}/Firebase/${pod}/${fw}.xcframework"
        if [ -d "${src}" ]; then
            found="${src}"
            break
        fi
    done
    if [ -z "${found}" ]; then
        missing+=("${fw}")
        continue
    fi
    cp -R "${found}" "${DEST_DIR}/${fw}.xcframework"
done

if [ "${#missing[@]}" -gt 0 ]; then
    echo "error: could not locate the following xcframeworks in the release zip:" >&2
    printf '  - %s\n' "${missing[@]}" >&2
    echo "The Firebase.zip layout may have changed for ${FIREBASE_VERSION}. Please" >&2
    echo "update PODS/FRAMEWORKS in this script (and REQUIRED_XCFRAMEWORKS in" >&2
    echo "extensions/firebase/source/BuildTaskiOS.ts) to match." >&2
    exit 1
fi

echo "==> Done. $(ls "${DEST_DIR}" | wc -l | tr -d ' ') xcframeworks installed at:"
echo "    ${DEST_DIR}"
echo "==> You can now build for iOS from the Cocos Creator Build panel."
