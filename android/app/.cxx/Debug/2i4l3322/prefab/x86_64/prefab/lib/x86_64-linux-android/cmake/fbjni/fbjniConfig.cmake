if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/d9d0a641eac3745e8cbb3027750a75b0/gradle/caches/8.13/transforms/b60c1380c227a6ffbce61b3c3b53d3af/transformed/fbjni-0.7.0/prefab/modules/fbjni/libs/android.x86_64/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/private/var/folders/0j/r0zk9g3n38j1x__vl88gtb6m0000gn/T/cursor-sandbox-cache/d9d0a641eac3745e8cbb3027750a75b0/gradle/caches/8.13/transforms/b60c1380c227a6ffbce61b3c3b53d3af/transformed/fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

