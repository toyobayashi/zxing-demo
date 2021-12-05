cmake_minimum_required(VERSION 3.17.0)

project(zxingdemo)

set(BUILD_WRITERS ON)
add_subdirectory("deps/zxing-cpp/core")

add_executable(zxingwasm
  "${CMAKE_CURRENT_SOURCE_DIR}/node_modules/@tybys/emnapi/src/emnapi.c"
  "src/binding.cpp"
)

set_target_properties(zxingwasm
 PROPERTIES CXX_STANDARD 17
)

target_include_directories(zxingwasm PRIVATE
  "${CMAKE_CURRENT_SOURCE_DIR}//node_modules/@tybys/emnapi/include"
)

target_compile_options(zxingwasm PRIVATE
  "-sDISABLE_EXCEPTION_CATCHING=0"
)

target_link_options(zxingwasm PRIVATE
  "-sDISABLE_EXCEPTION_CATCHING=0"
  "-sALLOW_MEMORY_GROWTH=1"
  "--js-library=${CMAKE_CURRENT_SOURCE_DIR}/node_modules/@tybys/emnapi/dist/library_napi.js"
)

target_link_libraries(zxingwasm ZXing)
