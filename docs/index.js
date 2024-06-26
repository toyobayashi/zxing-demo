/// <reference path="zxingwasm.d.ts" />

import { Component, EventEmitter } from './dom.js'

function throttle (fn, wait) {
  let last = 0
  return function () {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      const result = fn.apply(this, arguments)
      return { invoked: true, result }
    }
    return { invoked: false }
  }
}

/** @type {zxingwasm.ModuleInstance} */
let Module

class DecodeWidgetModel {
  constructor () {
    this._cameraOpen = false
    this._openChangeEvent = new EventEmitter()
    this.onDidOpenChange = this._openChangeEvent.event
  }

  get cameraOpen () { return this._cameraOpen }
  set cameraOpen (value) {
    this._cameraOpen = value
    this._openChangeEvent.fire(value)
  }
}

class FileInput extends Component {
  constructor (container, model) {
    super()
    this.domNode = document.createElement('div')
    this._changeEvent = new EventEmitter()
    this.onDidChange = this._changeEvent.event
    this._clickEvent = new EventEmitter()
    this.onDidCaptureClick = this._clickEvent.event

    const label = document.createElement('label')
    label.innerText = 'Select QRCode Image'
    const fileInput = this._input = document.createElement('input')
    fileInput.id = 'imageInput'
    const selectImageButton = document.createElement('button')
    selectImageButton.style.fontSize = '32px'
    selectImageButton.setAttribute('disabled', '')
    Module.then(() => { selectImageButton.removeAttribute('disabled') })
    label.htmlFor = fileInput.id
    selectImageButton.appendChild(label)
    fileInput.style.display = 'none'
    fileInput.type = 'file'

    this._addEventListener(fileInput, 'change', (e) => {
      this._changeEvent.fire(e)
    })

    const recordButton = document.createElement('button')
    recordButton.style.fontSize = '32px'
    recordButton.style.marginLeft = '32px'
    recordButton.innerText = 'Start Capture'
    recordButton.setAttribute('disabled', '')
    Module.then(() => { recordButton.removeAttribute('disabled') })

    this._register(model.onDidOpenChange((value) => {
      const opening = value instanceof Promise
      if (opening) {
        selectImageButton.setAttribute('disabled', '')
        recordButton.setAttribute('disabled', '')
      } else {
        recordButton.removeAttribute('disabled')
        if (value) {
          selectImageButton.setAttribute('disabled', '')
        } else {
          selectImageButton.removeAttribute('disabled')
        }
      }
      recordButton.innerText = !value || opening ? 'Start Capture' : 'Stop Capture'
    }))

    this._addEventListener(recordButton, 'click', (e) => {
      this._clickEvent.fire(e)
    })

    this.domNode.appendChild(selectImageButton)
    this.domNode.appendChild(fileInput)
    this.domNode.appendChild(recordButton)
    container.appendChild(this.domNode)
  }
}

class ImageCanvas extends Component {
  constructor (container) {
    super()
    this.domNode = document.createElement('div')
    this._canvas = document.createElement('canvas')
    this._positionCanvas = document.createElement('canvas')
    this._positionCanvas.style.position = 'absolute'
    this._positionCanvas.style.left = '0'
    this._positionCanvas.style.top = '0'
    this.resetSize()
    this.domNode.appendChild(this._canvas)
    this.domNode.appendChild(this._positionCanvas)
    this.domNode.style.position = 'relative'
    this.domNode.style.display = 'inline-block'
    this.domNode.style.lineHeight = '0'
    this.domNode.style.border = '1px solid #000'
    this.domNode.style.marginTop = '16px'
    container.appendChild(this.domNode)
  }

  get canvas () {
    return this._canvas
  }

  resetSize (width, height) {
    this._canvas.width = width || 800
    this._canvas.height = height || 600
    this._positionCanvas.width = width || 800
    this._positionCanvas.height = height || 600
  }

  clear () {
    this._canvas.getContext("2d").clearRect(0, 0, this._canvas.width, this._canvas.height)
    this.clearPosition()
  }

  clearPosition () {
    this._positionCanvas.getContext("2d").clearRect(0, 0, this._positionCanvas.width, this._positionCanvas.height)
  }

  drawPosition (position) {
    this.clearPosition()
    const [topLeft, topRight, bottomRight, bottomLeft] = position
    const canvas = this._positionCanvas
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

  showImage (img) {
    this.clear()
    const canvas = this._canvas
    this.resetSize(img.width, img.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)
  }
}

class TextResult extends Component {
  constructor (container) {
    super()
    this.domNode = document.createElement('p')
    container.appendChild(this.domNode)
  }

  clear () {
    this.domNode.innerHTML = ''
  }
}

class TextInput extends Component {
  constructor (container) {
    super()
    // this.domNode = document.createElement('div')
    this.domNode = document.createElement('textarea')
    this.domNode.style.width = '302px'
    this.domNode.style.boxSizing = 'border-box'
    this.domNode.style.verticalAlign = 'bottom'
    this.domNode.style.marginRight = '20px'
    // this.domNode.appendChild(this.domNode)
    container.appendChild(this.domNode)
  }

  get value () {
    return this.domNode.value
  }
}

class ConfirmButton extends Component {
  constructor (container) {
    super()
    this._clickEvent = new EventEmitter()
    this.onDidClick = this._clickEvent.event
    // this.domNode = document.createElement('div')
    this.domNode = document.createElement('button')
    this.domNode.style.fontSize = '24px'
    this.domNode.setAttribute('disabled', '')
    Module.then(() => { this.domNode.removeAttribute('disabled') })
    this.domNode.innerHTML = 'Generate'
    this._addEventListener(this.domNode, 'click', (e) => {
      this._clickEvent.fire(e)
    })
    // this.domNode.appendChild(this._btn)
    container.appendChild(this.domNode)
  }
}

class ResultCanvas extends Component {
  constructor (container) {
    super()
    this.domNode = document.createElement('div')
    this._canvas = document.createElement('canvas')
    this.domNode.style.display = 'inline-block'
    this.domNode.style.lineHeight = '0'
    this.domNode.style.border = '1px solid #000'
    this.domNode.style.marginTop = '16px'

    this._canvas.width = 400
    this._canvas.height = 400
    this.domNode.appendChild(this._canvas)
    container.appendChild(this.domNode)
  }

  get canvas () {
    return this._canvas
  }
}

class DecodeWidget extends Component {
  constructor (container, model) {
    super()
    this.decodeModel = model
    this.domNode = document.createElement('div')
    container.appendChild(this.domNode)
    this.domNode.style.textAlign = 'center'
    this._InputEl = this._register(new FileInput(this.domNode, model))
    this._canvasEl = this._register(new ImageCanvas(this.domNode))
    this._resultEl = this._register(new TextResult(this.domNode))
    this._videoEl = document.createElement('video')
    this._videoEl.autoplay = true
    this._videoEl.style.display = 'none'
    this.domNode.appendChild(this._videoEl)

    this._register(this._InputEl.onDidChange(async (e) => {
      const f = e.target.files[0]
      if (f && (f.name.endsWith('.png') || f.name.endsWith('.jpeg') || f.name.endsWith('.jpg'))) {
        const dataUrl = await this.readFileAsDataURL(f)
        const img = await this.getImage(dataUrl, f.type)
        this._canvasEl.showImage(img)
        const result = this.scanImage()
        this.showScanResult(result)
      }
    }))
    this._register(this._InputEl.onDidCaptureClick(() => {
      if (model.cameraOpen instanceof Promise) return
      this._resultEl.clear()
      this._canvasEl.clear()
      if (!model.cameraOpen) {
        this.startCapture()
      } else {
        this.stopCapture()
      }
    }))
  }

  startCapture () {
    this._canvasEl.resetSize()
    this.decodeModel.cameraOpen = navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    this.decodeModel.cameraOpen.then(stream => {
      this.decodeModel.cameraOpen = stream
      this._videoEl.srcObject = stream
      const scanImage = throttle(() => {
        return this.scanImage()
      }, 250)
      const callback = () => {
        if (this.decodeModel.cameraOpen) {
          this.showFrame()
          let invoked, result
          try {
            const ret = scanImage()
            invoked = ret.invoked
            result = ret.result
          } catch (err) {
            this._resultEl.clear()
            this.stopCapture()
            return
          }
          if (invoked && (result.error || result.format !== Module.emnapiExports.BarcodeFormat.None)) {
            this.showScanResult(result)
            requestAnimationFrame(callback)
            // this.stopCapture()
          } else {
            requestAnimationFrame(callback)
          }
        }
      }
      requestAnimationFrame(callback)
    }, err => {
      window.alert(err.message)
    })
  }

  stopCapture () {
    /** @type {MediaStream} */
    const stream = this._videoEl.srcObject
    const tracks = stream.getTracks()
    tracks.forEach((track) => track.stop())
    this._videoEl.srcObject = null
    this.decodeModel.cameraOpen = false
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

  scanImage () {
    /** @type {HTMLCanvasElement} */
    const canvas = this._canvasEl.canvas
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const buffer = Module._malloc(data.length)
    Module.HEAPU8.set(data, buffer)
    const u8arr = new Uint8Array(Module.HEAPU8.buffer, buffer, data.length)
    let result
    try {
      const format = 'Aztec|Codabar|Code39|Code93|Code128|DataBar|DataBarExpanded|DataMatrix|EAN-8|EAN-13|ITF|MaxiCode|MicroQRCode|PDF417|QRCode|rMQRCode|UPC-A|UPC-E|Linear-Codes|Matrix-Codes'
      result = Module.emnapiExports.readFromRawImage(u8arr, canvas.width, canvas.height, true, format)
    } catch (err) {
      window.alert(err.message)
      Module._free(buffer)
      throw err
    }
    Module._free(buffer)

    return result
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

  showFrame () {
    const canvas = this._canvasEl.canvas
    const ctx = canvas.getContext("2d")
    ctx.drawImage(this._videoEl, 0, 0, canvas.width, canvas.height)
  }

  showScanResult (result) {
    if (result.position) {
      this._canvasEl.drawPosition(result.position)
    }
    if (result.error) {
      this._resultEl.domNode.innerHTML = '<font color="red">Error: ' + result.error + '</font>'
    } else if (result.format) {
      this._resultEl.domNode.innerHTML = "Format: <strong>" + Module.emnapiExports.barcodeFormatToString(result.format) + "</strong><pre>" + result.text + "</pre>"
    } else {
      this._resultEl.domNode.innerHTML = "No QRCode found"
    }
  }
}

class EncodeWidget extends Component {
  constructor (container) {
    super()
    this.domNode = document.createElement('div')
    this.domNode.style.textAlign = 'center'
    this.domNode.style.marginLeft = '60px'
    container.appendChild(this.domNode)

    const inputWrap = document.createElement('div')
    this.domNode.appendChild(inputWrap)

    const formatSelectWrap = document.createElement('div')
    formatSelectWrap.style.marginBottom = '16px'
    const formatSelect = document.createElement('select')
    formatSelect.style.fontSize = '32px'
    formatSelectWrap.appendChild(formatSelect)
    
    Module.then(() => {
      [
        Module.emnapiExports.BarcodeFormat.Aztec,
        Module.emnapiExports.BarcodeFormat.DataMatrix,
        Module.emnapiExports.BarcodeFormat.PDF417,
        Module.emnapiExports.BarcodeFormat.QRCode,
        Module.emnapiExports.BarcodeFormat.Codabar,
        Module.emnapiExports.BarcodeFormat.Code39,
        Module.emnapiExports.BarcodeFormat.Code93,
        Module.emnapiExports.BarcodeFormat.Code128,
        // Module.emnapiExports.BarcodeFormat.EAN8,
        // Module.emnapiExports.BarcodeFormat.EAN13,
        Module.emnapiExports.BarcodeFormat.ITF,
        // Module.emnapiExports.BarcodeFormat.UPCA,
        // Module.emnapiExports.BarcodeFormat.UPCE,
      ].map(value => {
        return { label: Module.emnapiExports.barcodeFormatToString(value), value }
      }).forEach((item) => {
        const optionEl = document.createElement('option')
        optionEl.value = String(item.value)
        optionEl.text = item.label
        formatSelect.appendChild(optionEl)
      })

      formatSelect.value = String(Module.emnapiExports.BarcodeFormat.QRCode)
    })
    inputWrap.appendChild(formatSelectWrap)

    this._textInput = this._register(new TextInput(inputWrap))
    this._genButton = this._register(new ConfirmButton(inputWrap))

    this._resultCanvas = this._register(new ResultCanvas(this.domNode))

    this._register(this._genButton.onDidClick(() => {
      if (!this._textInput.value) {
        return
      }
      const canvas = this._resultCanvas.canvas
      let matrix
      const format = Number(formatSelect.value)
      try {
        matrix = Module.emnapiExports.generateMatrix(this._textInput.value, format, 'UTF-8', 10, 400, 400, -1)
      } catch (err) {
        console.error(err)
        window.alert(err.message)
        return
      }
      const dataPtr = matrix.getDataAddress()
      const dataSize = matrix.getDataSize()
      const matrixWidth = matrix.getWidth()
      const matrixHeight = matrix.getHeight()
      canvas.width = matrixWidth
      canvas.height = matrixHeight
      console.log(matrixWidth, matrixHeight, dataPtr, dataSize)
      // const buffer = matrix.getBuffer()
      const buffer = new Uint8Array(Module.HEAPU8.buffer, dataPtr, dataSize)
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const imageData = ctx.createImageData(matrixWidth, matrixHeight)
      const pixelSize = matrixWidth * matrixHeight
      for (let i = 0; i < pixelSize; i++) {
        imageData.data.set([buffer[i], buffer[i], buffer[i], 255], i * 4)
      }
      ctx.putImageData(imageData, 0, 0)
      matrix.destroy()
    }))
  }
}

class App extends Component {
  static main () {
    Module = zxingwasm()
    Module.then((M) => {
      Module = M
      Module.emnapiExports = Module.emnapiInit({ context: emnapi.getDefaultContext() })
      console.log(Module.emnapiExports)
    })
    new App(document.body)
  }

  constructor (container) {
    super()
    this.domNode = document.createElement('div')
    this.domNode.style.display = 'flex'
    this.domNode.style.justifyContent = 'center'

    const decodeModel = new DecodeWidgetModel()

    this._decodeWidget = this._register(new DecodeWidget(this.domNode, decodeModel))
    this._encodeWidget = this._register(new EncodeWidget(this.domNode))

    container.appendChild(this.domNode)
  }
}

App.main()
