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
    this.resetSize()
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

  resetSize () {
    this._canvas.width = 800
    this._canvas.height = 600
  }

  clear () {
    const ctx = this._canvas.getContext("2d")
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
  }
}

class TextResult extends Component {
  constructor (container) {
    super()
    this.domNode = document.createElement('p')
    container.appendChild(this.domNode)
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
        this.showImage(img)
        const result = this.scanImage()
        this.showScanResult(result)
      }
    }))
    this._register(this._InputEl.onDidCaptureClick(() => {
      if (model.cameraOpen instanceof Promise) return
      if (!model.cameraOpen) {
        this.startCapture()
      } else {
        this.stopCapture()
        this._canvasEl.clear()
      }
    }))
  }

  startCapture () {
    this._resultEl.domNode.innerHTML = ''
    this._canvasEl.resetSize()
    this.decodeModel.cameraOpen = navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    this.decodeModel.cameraOpen.then(stream => {
      this.decodeModel.cameraOpen = stream
      this._videoEl.srcObject = stream
      const scanImage = throttle(() => {
        return this.scanImage()
      }, 500)
      const callback = () => {
        if (this.decodeModel.cameraOpen) {
          this.showFrame()
          let invoked, result
          try {
            const ret = scanImage()
            invoked = ret.invoked
            result = ret.result
          } catch (err) {
            this.stopCapture()
            return
          }
          if (invoked && (result.error || result.format !== 'None')) {
            this.showScanResult(result)
            this.stopCapture()
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
    if (result.position) {
      this.showPosition(result.position)
    }
    if (result.error) {
      this._resultEl.domNode.innerHTML = '<font color="red">Error: ' + result.error + '</font>'
    } else if (result.format) {
      this._resultEl.domNode.innerHTML = "Format: <strong>" + result.format + "</strong><pre>" + result.text + "</pre>"
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
    this._textInput = this._register(new TextInput(inputWrap))
    this._genButton = this._register(new ConfirmButton(inputWrap))

    this._resultCanvas = this._register(new ResultCanvas(this.domNode))

    this._register(this._genButton.onDidClick(() => {
      const canvas = this._resultCanvas.canvas
      let matrix
      try {
        matrix = Module.emnapiExports.generateMatrix(this._textInput.value, 'QRCode', 'UTF-8', 10, canvas.width, canvas.height, -1)
      } catch (err) {
        console.error(err)
        window.alert(err.message)
        return
      }
      const dataPtr = matrix.getDataAddress()
      const dataSize = matrix.getDataSize()
      console.log(matrix.getWidth(), matrix.getHeight(), dataPtr, dataSize)
      // const buffer = matrix.getBuffer()
      const buffer = new Uint8Array(Module.HEAPU8.buffer, dataPtr, dataSize)
      const ctx = canvas.getContext('2d')
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const pixelSize = canvas.width * canvas.height
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
