{
  "variables": {
    "module_name": "zxing",
    "module_path": "./test"
  },
  'targets': [
    {
      'target_name': '<(module_name)',
      'sources': [
        'src/binding.cpp',
        'src/Matrix.cpp',
      ],
      'cflags_cc': [
        '-std=c++17'
      ],
      'dependencies': [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
        'deps/zxing-cpp/core/zxing.gyp:zxingcore'
      ],
      'msvs_settings': {
        'VCCLCompilerTool': {
          'AdditionalOptions': ['-std:c++17'],
        },
      },
      'xcode_settings': {
        'CLANG_CXX_LANGUAGE_STANDARD': 'c++17',
      }
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
          "destination": "<(module_path)"
        }
      ]
    }
  ]
}
