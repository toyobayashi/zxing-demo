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
      if (f.name.endsWith('.png') || f.name.endsWith('.jpeg') || f.name.endsWith('.jpg')) {
        this.scanImage(f)
      }
    })

    this._genButton.onDidClick(() => {
      const canvas = this._resultCanvas.canvas
      const result = Module.emnapiExports.generateBarcode(this._textInput._input.value, 'QRCode', 'UTF-8', 10, canvas.width, canvas.height, -1)
      if (result.error) {
        window.alert(result.error)
        return
      }
      const buffer = new Uint8Array(Module.HEAPU8.buffer, result.buffer, result.length)
      const ctx = canvas.getContext('2d')
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const pixelSize = canvas.width * canvas.height
      for (let i = 0; i < pixelSize; i++) {
        imageData.data.set([buffer[i], buffer[i], buffer[i], 255], i * 4)
      }
      ctx.putImageData(imageData, 0, 0)
      Module.emnapiExports.releaseImage(result.buffer)
      console.log(result)
    })

    container.appendChild(this.domNode)
  }

  scanImage (file) {
    var reader = new FileReader();
    reader.onloadend = (evt) => {
      var format = 'QRCode';

      this.getImage(evt.target.result, file.type).then(img => {
        this.showImage(img)
        /** @type {HTMLCanvasElement} */
        const canvas = this._canvasEl.canvas
        const ctx = canvas.getContext("2d")
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        var buffer = Module._malloc(data.length);
        Module.HEAPU8.set(data, buffer);
        var result = Module.emnapiExports.readBarcodeFromImage(buffer, data.length, img.width, img.height, true, format);
        Module._free(buffer);

        console.log(result)

        if (!result.error) {
          this.showPosition(result.position)
          this.showScanResult(result);
        }
      })
    }
    reader.readAsDataURL(file)
  }

  getImage (dataUrl, fileType) {
    return new Promise((resolve, reject) => {
      fileType = fileType || "image/jpeg";
      var img = document.createElement("img");
      img.onload = function() {
        img.onload = null
        img.onerror = null
        resolve(img)
      };
      img.onerror = function () {
        img.onload = null
        img.onerror = null
        reject(new Error('123'))
      }
      img.src = dataUrl
    })
  }

  showImage (img) {
    const canvas = this._canvasEl.canvas
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
  }

  showPosition (position) {
    const canvas = this._canvasEl.canvas
    const ctx = canvas.getContext("2d")
    ctx.beginPath();
    ctx.moveTo(position.topLeft.x, position.topLeft.y);
    ctx.lineTo(position.topRight.x, position.topRight.y);
    ctx.lineTo(position.bottomRight.x, position.bottomRight.y);
    ctx.lineTo(position.bottomLeft.x, position.bottomLeft.y);
    ctx.closePath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  showScanResult (result) {
    if (result.error) {
      this._resultEl.domNode.innerHTML = '<font color="red">Error: ' + result.error + '</font>';
    } else if (result.format) {
      this._resultEl.domNode.innerHTML = "Format: <strong>" + result.format + "</strong><pre>" + result.text + "</pre>";
    } else {
      this._resultEl.domNode.innerHTML = "No QRCode found"
    }
  }
}

new App(document.body)
