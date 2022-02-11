const path = require('path')
const Jimp = require('jimp')
const assert = require('assert')

const {
  readBarcodeFromImage,
  generateBarcode
} = require('./zxing')

function createImage (data, width, height) {
  return new Promise((resolve, reject) => {
    new Jimp(width, height, (err, image) => {
      if (err) {
        return reject(err)
      }
      const size = width * height
      for (let i = 0; i < size; ++i) {
        image.bitmap.data.set([data[i], data[i], data[i], 255], i * 4)
      }
      resolve(image)
    })
  })
}

async function main () {
  const format = 'QRCode'
  const encoding = 'UTF-8'
  const width = 300
  const height = 300
  const margin = 10
  const eccLevel = -1

  const input = '扫码发大财'

  const matrix = generateBarcode(input, format, encoding, margin, width, height, eccLevel)
  const image = await createImage(matrix.getBuffer(), matrix.getWidth(), matrix.getHeight())
  matrix.destroy()
  const pngFile = path.join(__dirname, 'test.png')
  await image.writeAsync(pngFile)

  const readImage = await Jimp.read(pngFile)
  const imageData = new Uint8Array(readImage.bitmap.data.buffer)
  const result = readBarcodeFromImage(imageData, readImage.bitmap.width, readImage.bitmap.height, true, 'QRCode')
  if (result.error) {
    throw new Error(result.error)
  }
  console.log(result)
  assert.strictEqual(result.text, input)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
