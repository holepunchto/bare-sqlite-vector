cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(bare_sqlite_vector C)

fetch_package(
  "github:sqliteai/sqlite-vector#0.9.95"
  SOURCE_DIR sqlite_vector
  PATCHES
    patches/001-windows-strcasecmp-shim.patch
    patches/002-windows-fp16-intrin-include.patch
)

add_library(sqlite_vector)

target_sources(
  sqlite_vector
  PRIVATE
    ${sqlite_vector}/src/sqlite-vector.c
    ${sqlite_vector}/src/distance-cpu.c
    ${sqlite_vector}/src/distance-avx2.c
    ${sqlite_vector}/src/distance-avx512.c
    ${sqlite_vector}/src/distance-sse2.c
    ${sqlite_vector}/src/distance-neon.c
    ${sqlite_vector}/src/distance-rvv.c
)

target_include_directories(
  sqlite_vector
  PRIVATE
    ${sqlite_vector}/src
    ${sqlite_vector}/libs
  INTERFACE
    ${sqlite_vector}/src
    ${sqlite_vector}/libs
)

target_compile_definitions(
  sqlite_vector
  PUBLIC
    SQLITE_CORE
)

add_bare_module(bare_sqlite_vector)

target_sources(
  ${bare_sqlite_vector}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${bare_sqlite_vector}
  PRIVATE
    sqlite_vector
)

link_bare_module(${bare_sqlite_vector} bare-sqlite SHARED)
