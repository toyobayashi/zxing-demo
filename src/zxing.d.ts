export declare type Format = 
  "None" |
  "Aztec" |
  "Codabar" |
  "Code39" |
  "Code93" |
  "Code128" |
  "DataBar" |
  "DataBarExpanded" |
  "DataMatrix" |
  "EAN-8" |
  "EAN-13" |
  "ITF" |
  "MaxiCode" |
  "PDF417" |
  "QRCode" |
  "UPC-A" |
  "UPC-E" |
  "1D-Codes" |
  "2D-Codes"

export declare interface Point {
  x: number
  y: number
}

export declare type Position = [Point, Point, Point, Point]

export declare interface ReadResult {
  format: Format
  text: string
  error: string
  position: Position | null
}

export declare function readBarcodeFromImage (
  imageData: Uint8Array,
  width: number,
  height: number,
  tryHarder: boolean,
  format: Format
): ReadResult

export declare type Charset = 
  "Cp437" |
  "ISO8859_1" |
  "ISO-8859-1" |
  "ISO8859_2" |
  "ISO-8859-2" |
  "ISO8859_3" |
  "ISO-8859-3" |
  "ISO8859_4" |
  "ISO-8859-4" |
  "ISO8859_5" |
  "ISO-8859-5" |
  "ISO8859_6" |
  "ISO-8859-6" |
  "ISO8859_7" |
  "ISO-8859-7" |
  "ISO8859_8" |
  "ISO-8859-8" |
  "ISO8859_9" |
  "ISO-8859-9" |
  "ISO8859_10" |
  "ISO-8859-10" |
  "ISO8859_11" |
  "ISO-8859-11" |
  "ISO8859_13" |
  "ISO-8859-13" |
  "ISO8859_14" |
  "ISO-8859-14" |
  "ISO8859_15" |
  "ISO-8859-15" |
  "ISO8859_16" |
  "ISO-8859-16" |
  "SJIS" |
  "Shift_JIS" |
  "Cp1250" |
  "windows-1250" |
  "Cp1251" |
  "windows-1251" |
  "Cp1252" |
  "windows-1252" |
  "Cp1256" |
  "windows-1256" |
  "UnicodeBigUnmarked" |
  "UTF-16BE" |
  "UnicodeBig" |
  "UTF8" |
  "UTF-8" |
  "ASCII" |
  "US-ASCII" |
  "Big5" |
  "GB2312" |
  "GB18030" |
  "EUC_CN" |
  "EUC-CN" |
  "GBK" |
  "EUC_KR" |
  "EUC-KR" |
  "BINARY"

export declare type EccLevel = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export declare interface Matrix {
  getDataAddress: () => number
  getDataSize: () => number
  getWidth: () => number
  getHeight: () => number
  destroy: () => void
  getBuffer?: () => Uint8Array
}

export declare function generateBarcode (
  text: string,
  format: Format,
  encoding: Charset,
  margin: number,
  width: number,
  height: number,
  eccLevel: EccLevel
): Matrix
