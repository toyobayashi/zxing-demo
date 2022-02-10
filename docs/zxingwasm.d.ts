export as namespace zxingwasm

export default function (options?: any): Promise<{
  Module: {
    emnapiExports: typeof import('../src/zxing')
  }
}>
