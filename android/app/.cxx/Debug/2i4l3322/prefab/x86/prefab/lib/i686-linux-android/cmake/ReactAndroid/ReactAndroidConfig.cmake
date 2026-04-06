if(NOT TARGET ReactAndroid::hermestooling)
add_library(ReactAndroid::hermestooling SHARED IMPORTED)
set_target_properties(ReactAndroid::hermestooling PROPERTIES
    IMPORTED_LOCATION "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/a0bacb133618670fae975d13ee59d827/gradle/caches/8.13/transforms/161e9dfa4b5204375f69b69c8b60834d/transformed/react-android-0.82.1-debug/prefab/modules/hermestooling/libs/android.x86/libhermestooling.so"
    INTERFACE_INCLUDE_DIRECTORIES "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/a0bacb133618670fae975d13ee59d827/gradle/caches/8.13/transforms/161e9dfa4b5204375f69b69c8b60834d/transformed/react-android-0.82.1-debug/prefab/modules/hermestooling/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::jsi)
add_library(ReactAndroid::jsi SHARED IMPORTED)
set_target_properties(ReactAndroid::jsi PROPERTIES
    IMPORTED_LOCATION "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/a0bacb133618670fae975d13ee59d827/gradle/caches/8.13/transforms/161e9dfa4b5204375f69b69c8b60834d/transformed/react-android-0.82.1-debug/prefab/modules/jsi/libs/android.x86/libjsi.so"
    INTERFACE_INCLUDE_DIRECTORIES "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/a0bacb133618670fae975d13ee59d827/gradle/caches/8.13/transforms/161e9dfa4b5204375f69b69c8b60834d/transformed/react-android-0.82.1-debug/prefab/modules/jsi/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::reactnative)
add_library(ReactAndroid::reactnative SHARED IMPORTED)
set_target_properties(ReactAndroid::reactnative PROPERTIES
    IMPORTED_LOCATION "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/a0bacb133618670fae975d13ee59d827/gradle/caches/8.13/transforms/161e9dfa4b5204375f69b69c8b60834d/transformed/react-android-0.82.1-debug/prefab/modules/reactnative/libs/android.x86/libreactnative.so"
    INTERFACE_INCLUDE_DIRECTORIES "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/a0bacb133618670fae975d13ee59d827/gradle/caches/8.13/transforms/161e9dfa4b5204375f69b69c8b60834d/transformed/react-android-0.82.1-debug/prefab/modules/reactnative/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

