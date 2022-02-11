/// <reference path="zxingwasm.d.ts" />

const modulePromise = zxingwasm.default()

class FileInput {
  constructor (container) {
    this._handler = []
    this.domNode = document.createElement('div')
    const input = this._input = document.createElement('input')
    input.type = 'file'

    input.addEventListener('change', () => {
      this._handler.slice(0).forEach(fn => {
        fn(input.files)
      })
    })

    this.domNode.appendChild(input)
    container.appendChild(this.domNode)
  }

  onDidChange (fn) {
    if (this._handler.indexOf(fn) !== -1) return
    this._handler.push(fn)
  }

  dispose () {
    this._handler.slice(0).forEach(fn => {
      this._input.removeEventListener('change', fn)
    })
    this._handler.length = 0
  }
}

class ImageCanvas {
  constructor (container) {
    this.domNode = document.createElement('div')
    this._canvas = document.createElement('canvas')
    this.domNode.appendChild(this._canvas)
    this.domNode.style.display = 'inline-block'
    this.domNode.style.lineHeight = '0'
    this.domNode.style.border = '1px solid #000'
    this.domNode.style.marginTop = '16px'
    container.appendChild(this.domNode)
  }

  get canvas () {
    return this._canvas
  }
}

class TextResult {
  constructor (container) {
    this.domNode = document.createElement('p')
    container.appendChild(this.domNode)
  }
}

class TextInput {
  constructor (container) {
    this.domNode = document.createElement('div')
    this._input = document.createElement('textarea')
    this._input.style.width = '302px'
    this._input.style.boxSizing = 'border-box'
    this.domNode.appendChild(this._input)
    container.appendChild(this.domNode)
  }
}

class ConfirmButton {
  constructor (container) {
    this._handler = []
    this.domNode = document.createElement('div')
    this._btn = document.createElement('button')
    this._btn.innerHTML = 'Generate'
    this._btn.addEventListener('click', (e) => {
      this._handler.slice(0).forEach(fn => {
        fn.call(this._btn, e)
      })
    })
    this.domNode.appendChild(this._btn)
    container.appendChild(this.domNode)
  }

  onDidClick (fn) {
    if (this._handler.indexOf(fn) !== -1) return
    this._handler.push(fn)
  }

  dispose () {
    this._handler.slice(0).forEach(fn => {
      this._input.removeEventListener('click', fn)
    })
    this._handler.length = 0
  }
}

class ResultCanvas {
  constructor (container) {
    this.domNode = document.createElement('div')
    this._canvas = document.createElement('canvas')
    this.domNode.style.display = 'inline-block'
    this.domNode.style.lineHeight = '0'
    this.domNode.style.border = '1px solid #000'
    this.domNode.style.marginTop = '16px'

    this._canvas.width = 300
    this._canvas.height = 300
    this.domNode.appendChild(this._canvas)
    container.appendChild(this.domNode)
  }

  get canvas () {
    return this._canvas
  }
}

class App {
  constructor (container) {
    this.domNode = document.createElement('div')

    this._InputEl = new FileInput(this.domNode)
    this._canvasEl = new ImageCanvas(this.domNode)
    this._resultEl = new TextResult(this.domNode)

    this.domNode.appendChild(document.createElement('hr'))

    this._textInput = new TextInput(this.domNode)
    this._genButton = new ConfirmButton(this.domNode)
    this._resultCanvas = new ResultCanvas(this.domNode)

    this._InputEl.onDidChange((files) => {
      const f = files[0]
      if (f && (f.name.endsWith('.png') || f.name.endsWith('.jpeg') || f.name.endsWith('.jpg'))) {
        this.scanImage(f)
      }
    })

    this._genButton.onDidClick(async () => {
      const { Module } = await modulePromise
      const canvas = this._resultCanvas.canvas
      let matrix
      try {
        matrix = Module.emnapiExports.generateMatrix(this._textInput._input.value, 'QRCode', 'UTF-8', 10, canvas.width, canvas.height, -1)
      } catch (err) {
        console.error(err)
        window.alert(err.message)
        return
      }
      const dataPtr = matrix.getDataAddress()
      const dataSize = matrix.getDataSize()
      console.log(matrix.getWidth(), matrix.getHeight(), dataPtr, dataSize)
      const buffer = new Uint8Array(Module.HEAPU8.buffer, dataPtr, dataSize)
      const ctx = canvas.getContext('2d')
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const pixelSize = canvas.width * canvas.height
      for (let i = 0; i < pixelSize; i++) {
        imageData.data.set([buffer[i], buffer[i], buffer[i], 255], i * 4)
      }
      ctx.putImageData(imageData, 0, 0)
      matrix.destroy()
    })

    container.appendChild(this.domNode)
  }

  readFileAsDataURL (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = (event) => {
        resolve(event.target.result)
      }
      reader.onerror = () => {
        reject(new Error('Read file failed: ' + file.name))
      }
      reader.readAsDataURL(file)
    })
  }

  async scanImage (file) {
    const dataUrl = await this.readFileAsDataURL(file)
    const img = await this.getImage(dataUrl, file.type)
    const { Module } = await modulePromise
    this.showImage(img)
    /** @type {HTMLCanvasElement} */
    const canvas = this._canvasEl.canvas
    const ctx = canvas.getContext("2d")
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const buffer = Module._malloc(data.length)
    Module.HEAPU8.set(data, buffer)
    const u8arr = new Uint8Array(Module.HEAPU8.buffer, buffer, data.length)
    let result
    try {
      result = Module.emnapiExports.readFromRawImage(u8arr, img.width, img.height, true, 'QRCode')
    } catch (err) {
      console.error(err)
      window.alert(err.message)
      Module._free(buffer)
      return
    }
    Module._free(buffer)

    console.log(JSON.stringify(result, null, 2))

    if (result.position) {
      this.showPosition(result.position)
    }
    this.showScanResult(result)
  }

  getImage (dataUrl, fileType) {
    return new Promise((resolve, reject) => {
      fileType = fileType || "image/jpeg"
      const img = document.createElement("img")
      img.onload = function() {
        img.onload = null
        img.onerror = null
        resolve(img)
      }
      img.onerror = function () {
        img.onload = null
        img.onerror = null
        reject(new Error('img load failed'))
      }
      img.src = dataUrl
    })
  }

  showImage (img) {
    const canvas = this._canvasEl.canvas
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)
  }

  showPosition (position) {
    const [topLeft, topRight, bottomRight, bottomLeft] = position
    const canvas = this._canvasEl.canvas
    const ctx = canvas.getContext("2d")
    ctx.beginPath()
    ctx.moveTo(topLeft.x, topLeft.y)
    ctx.lineTo(topRight.x, topRight.y)
    ctx.lineTo(bottomRight.x, bottomRight.y)
    ctx.lineTo(bottomLeft.x, bottomLeft.y)
    ctx.closePath()
    ctx.strokeStyle = "red"
    ctx.lineWidth = 3
    ctx.stroke()
  }

  showScanResult (result) {
    if (result.error) {
      this._resultEl.domNode.innerHTML = '<font color="red">Error: ' + result.error + '</font>'
    } else if (result.format) {
      this._resultEl.domNode.innerHTML = "Format: <strong>" + result.format + "</strong><pre>" + result.text + "</pre>"
    } else {
      this._resultEl.domNode.innerHTML = "No QRCode found"
    }
  }
}

new App(document.body)
