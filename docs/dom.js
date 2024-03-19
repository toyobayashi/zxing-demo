export class DisposableStore {
  constructor () {
    this._disposables = new Set()
  }

  add (disposable) {
    this._disposables.add(disposable)
  }

  delete (disposable) {
    this._disposables.delete(disposable)
  }

  dispose () {
    this._disposables.forEach(disposable => { disposable.dispose() })
    this._disposables.clear()
  }
}

export class Component {
  constructor () {
    this._disposableStore = new DisposableStore()
  }

  dispose () {
    this._disposableStore.dispose()
  }

  _register (disposable) {
    this._disposableStore.add(disposable)
    return disposable
  }

  _unregister (disposable) {
    this._disposableStore.delete(disposable)
    disposable.dispose()
  }

  _addEventListener (dom, type, fn, options) {
    dom.addEventListener(type, fn, options)
    let removed = false
    return this._register({
      type,
      listener: fn,
      options,
      dispose: () => {
        if (removed) return
        removed = true
        dom.removeEventListener(type, fn, options)
      }
    })
  }
}

export class EventEmitter {
  constructor () {
    this._handlers = []
  }

  _off (handler) {
    const handlers = this._handlers
    for (let i = 0; i < handlers.length; ++i) {
      if (handlers[i] === handler) {
        handlers.splice(i, 1)
      }
    }
  }

  _on (fn, options) {
    const once = options ? Boolean(options.once) : false
    const handler = {
      listener: once ? (payload) => {
        try {
          fn.call(this, payload)
        } finally {
          this._off(handler)
        }
      } : fn,
      dispose: () => {
        this._off(handler)
      }
    }
    this._handlers.push(handler)
    return handler
  }

  get event () {
    if (!this._event) {
      this._event = (fn) => {
        return this.on(fn)
      }
    }

    return this._event
  }

  on (fn) {
    return this._on(fn)
  }

  once (fn) {
    return this._on(fn, { once: true })
  }

  fire (payload) {
    const handlers = this._handlers.slice()
    handlers.forEach((handler) => {
      handler.listener.call(this, payload)
    })
  }

  dispose () {
    this._handlers = []
  }
}
