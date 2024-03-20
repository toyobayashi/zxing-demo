const fs = require('fs')
const path = require('path')

console.log('Copy output ...')
fs.copyFileSync(path.join(__dirname, '../build/cmake/zxingwasm.js'), path.join(__dirname, '../docs/zxingwasm.js'))
fs.copyFileSync(path.join(__dirname, '../build/cmake/zxingwasm.wasm'), path.join(__dirname, '../docs/zxingwasm.wasm'))
