# Firebase extension — auto-loaded by Cocos (Post-*.cmake) AFTER the executable target.
# Mirrors AdMob's Post-admob.cmake.
if(EXISTS ${RES_DIR}/proj/firebase)
    include(${RES_DIR}/proj/firebase/firebase.cmake)
endif()
