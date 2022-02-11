const path = require('path')
const fs = require('fs-extra')

fs.removeSync(path.join(__dirname, '../build'))
