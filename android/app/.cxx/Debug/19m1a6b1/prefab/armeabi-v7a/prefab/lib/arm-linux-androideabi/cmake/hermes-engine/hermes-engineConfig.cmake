if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/bhumit/.gradle/caches/8.13/transforms/16de6a164a927f72863b0d85288b2eb2/transformed/hermes-android-0.82.1-debug/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/bhumit/.gradle/caches/8.13/transforms/16de6a164a927f72863b0d85288b2eb2/transformed/hermes-android-0.82.1-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

