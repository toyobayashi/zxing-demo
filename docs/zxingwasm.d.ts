import { Context } from '@emnapi/runtime'

export interface ModuleInstance {
  emnapiInit: (options: { context: Context }) => typeof import('../src/zxing')
  emnapiExports: typeof import('../src/zxing')
  _malloc: (size: number) => number
  _free: (addr: number) => void
}

declare const init: (options?: any) => Promise<ModuleInstance>

export = init

export as namespace zxingwasm
