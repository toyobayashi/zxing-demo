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
      'includes': [
        './common.gypi'
      ],
      'dependencies': [
        'deps/zxing-cpp/core/zxing.gyp:zxingcore'
      ],
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
