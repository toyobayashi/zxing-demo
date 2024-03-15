cmake_minimum_required(VERSION 3.17.0)

project(zxingdemo)

set(BUILD_WRITERS ON)
set(BUILD_EXAMPLES OFF)

add_compile_options(
  "-sDISABLE_EXCEPTION_CATCHING=0"
)

add_subdirectory("deps/zxing-cpp/core")
add_subdirectory("node_modules/emnapi")

add_executable(zxingwasm
  "src/binding.cpp"
  "src/Matrix.cpp"
)

set_target_properties(zxingwasm
  PROPERTIES CXX_STANDARD 17
)

target_link_options(zxingwasm PRIVATE
  "-sDISABLE_EXCEPTION_CATCHING=0"
  "-sALLOW_MEMORY_GROWTH=1"
  "-sMIN_CHROME_VERSION=48"
  "-sMODULARIZE=1"
  "-sEXPORT_NAME=zxingwasm"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free']"
)

target_link_libraries(zxingwasm ZXing emnapi)
