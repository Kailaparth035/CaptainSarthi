if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/d9d0a641eac3745e8cbb3027750a75b0/gradle/caches/8.13/transforms/6060e53a772ef2a67199be576b1e5a44/transformed/hermes-android-0.82.1-debug/prefab/modules/hermesvm/libs/android.x86_64/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/d9d0a641eac3745e8cbb3027750a75b0/gradle/caches/8.13/transforms/6060e53a772ef2a67199be576b1e5a44/transformed/hermes-android-0.82.1-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

