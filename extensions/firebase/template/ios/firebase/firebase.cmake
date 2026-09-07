# firebase.cmake — builds the `firebase` ObjC bridge lib and links the bundled Firebase iOS
# SDK xcframeworks. The overall shape follows this extension family's admob.cmake:
#   • link each .xcframework DIRECTLY (Xcode picks device/simulator slice)
#   • add the Swift runtime search paths (Firebase is heavily Swift)
#   • link the required system frameworks
#
# PREREQUISITE: download the Firebase iOS SDK zip and unzip its *.xcframework bundles into
# this directory (template/ios/firebase/Firebase/), or a versioned subdirectory — see
# scripts/fetch-firebase-ios-sdk.sh. This GLOB picks up whatever is present there.

set(FIREBASE_OBJC_SOURCES)
file(GLOB_RECURSE FIREBASE_OBJC_SOURCES LIST_DIRECTORIES false
    "${CMAKE_CURRENT_LIST_DIR}/*.h"
    "${CMAKE_CURRENT_LIST_DIR}/*.m"
    "${CMAKE_CURRENT_LIST_DIR}/*.mm"
)
list(FILTER FIREBASE_OBJC_SOURCES EXCLUDE REGEX ".*\\.xcframework/.*")

foreach(file ${FIREBASE_OBJC_SOURCES})
    set_source_files_properties(${file} PROPERTIES COMPILE_OPTIONS "-fobjc-arc")
endforeach()

add_library(firebase ${FIREBASE_OBJC_SOURCES})
target_include_directories(firebase PRIVATE "${CMAKE_CURRENT_LIST_DIR}")
target_link_libraries(firebase ${ENGINE_NAME})

# Link the Firebase frameworks: for each xcframework, find the per-arch .framework,
# substitute the arch with $(CURRENT_ARCH), and link the resolved path to the `firebase`
# lib. This single mechanism adds BOTH the COMPILE -F (so FirebaseHub.mm finds
# <FirebaseCore/...>) AND the link, and the binaries propagate to the executable via
# `target_link_libraries(${EXECUTABLE_NAME} firebase)` at the bottom. Linking the
# xcframework directly with the plain `target_link_libraries(target X.xcframework)` form —
# which is sufficient for AdMob's two xcframeworks in admob.cmake — does not work here: the
# resulting executable's OTHER_LDFLAGS end up with neither a -framework nor a -F entry for
# Firebase, so its headers fail to resolve. Device-oriented (ios-arm64).
file(GLOB FIREBASE_XCFRAMEWORKS "${CMAKE_CURRENT_LIST_DIR}/Firebase/*.xcframework")
set(FB_ARCH arm64)
foreach(XCF ${FIREBASE_XCFRAMEWORKS})
    get_filename_component(XCFP ${XCF} ABSOLUTE)
    file(GLOB _FW "${XCFP}/ios-${FB_ARCH}/*.framework")
    get_filename_component(_FWN ${_FW} NAME_WE)
    find_library(FBLIB_${_FWN} ${_FWN}
        PATHS "${XCFP}/ios-${FB_ARCH}" NO_DEFAULT_PATH NO_CMAKE_FIND_ROOT_PATH)
    if(FBLIB_${_FWN} STREQUAL "FBLIB_${_FWN}-NOTFOUND")
        message("firebase: ${_FWN} NOT found")
    else()
        string(REPLACE "ios-${FB_ARCH}" "ios-\${CURRENT_ARCH}" _updated "${FBLIB_${_FWN}}")
        target_link_libraries(firebase ${_updated})
        message(STATUS "firebase: linked ${_FWN}")
    endif()
endforeach()

# Swift runtime search paths: Firebase's iOS SDK is heavily Swift-based, so the linker
# needs an explicit path to the Swift standard library alongside the app's own libraries.
target_link_options(firebase PRIVATE
    "-L$(SDKROOT)/usr/lib/swift"
    "-L$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)"
)
target_link_options(${EXECUTABLE_NAME} PRIVATE
    "-L$(SDKROOT)/usr/lib/swift"
    "-L$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)"
    "-Wl,-rpath,/usr/lib/swift"
)
# -ObjC: Firebase frameworks are STATIC archives — without this their ObjC classes
# (FIRApp/FIRAnalytics/FIRCrashlytics) are dropped by the linker → "Undefined symbols
# _OBJC_CLASS_$_FIR…". Passed as its own bareword call, matching how admob.cmake applies
# -ObjC; folding it into the quoted `"-framework ${_fw}"` list above did not emit it to the
# linker. Harmless if AdMob has already added -ObjC to the executable.
target_link_options(${EXECUTABLE_NAME} PRIVATE -ObjC)

# System frameworks + libs Firebase needs (validated by a force_load link smoke test of all
# 23 Firebase xcframeworks + GoogleMobileAds together: 0 duplicate, 0 undefined symbols).
# Several (Foundation/UIKit/Security/CFNetwork...) are already linked by the engine/AdMob —
# duplicates are harmless.
set(FIREBASE_SYSTEM_FRAMEWORKS
    SystemConfiguration Security StoreKit UserNotifications AuthenticationServices
    SafariServices CoreTelephony AdSupport AppTrackingTransparency
)
foreach(_fw ${FIREBASE_SYSTEM_FRAMEWORKS})
    target_link_libraries(${EXECUTABLE_NAME} "-framework ${_fw}")
endforeach()
target_link_libraries(${EXECUTABLE_NAME} "-lsqlite3" "-lz" "-lc++")

# Bundle GoogleService-Info.plist into the app's Resources so [FIRApp configure] finds it.
# (BuildTaskiOS.copyConfig drops the user's plist next to this cmake.)
set(FIREBASE_PLIST ${CMAKE_CURRENT_LIST_DIR}/GoogleService-Info.plist)
if(EXISTS ${FIREBASE_PLIST})
    target_sources(${EXECUTABLE_NAME} PRIVATE ${FIREBASE_PLIST})
    set_source_files_properties(${FIREBASE_PLIST} PROPERTIES MACOSX_PACKAGE_LOCATION "Resources")
    message(STATUS "firebase: bundled GoogleService-Info.plist")
else()
    message(WARNING "firebase: GoogleService-Info.plist missing — set its path in the Build panel")
endif()

target_include_directories(${EXECUTABLE_NAME} PUBLIC ${CMAKE_CURRENT_LIST_DIR})
target_link_libraries(${EXECUTABLE_NAME} firebase)
