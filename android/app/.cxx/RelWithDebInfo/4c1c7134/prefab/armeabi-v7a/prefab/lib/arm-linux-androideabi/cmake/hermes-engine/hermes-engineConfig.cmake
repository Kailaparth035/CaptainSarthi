if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/abcom/.gradle/caches/8.13/transforms/3339dabd912bfdab1288ca250aa986da/transformed/hermes-android-0.82.1-release/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/abcom/.gradle/caches/8.13/transforms/3339dabd912bfdab1288ca250aa986da/transformed/hermes-android-0.82.1-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

