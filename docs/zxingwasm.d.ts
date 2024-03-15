import { Context } from '@emnapi/runtime'

declare const init: (options?: any) => Promise<{
  emnapiInit: (options: { context: Context }) => typeof import('../src/zxing')
  emnapiExports: typeof import('../src/zxing')
  _malloc: (size: number) => number
  _free: (addr: number) => void
}>

export = init

export as namespace zxingwasm
