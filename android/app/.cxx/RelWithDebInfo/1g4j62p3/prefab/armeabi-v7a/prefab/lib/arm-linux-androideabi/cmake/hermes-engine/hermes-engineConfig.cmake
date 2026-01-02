if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/bhumit/.gradle/caches/8.13/transforms/a9583cc317318ab7278c4a985fd51e95/transformed/hermes-android-0.82.1-release/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/bhumit/.gradle/caches/8.13/transforms/a9583cc317318ab7278c4a985fd51e95/transformed/hermes-android-0.82.1-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

