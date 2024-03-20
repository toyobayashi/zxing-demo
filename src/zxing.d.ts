export declare enum BarcodeFormat {
	None            = 0,
	Aztec           = (1 << 0),
	Codabar         = (1 << 1),
	Code39          = (1 << 2),
	Code93          = (1 << 3),
	Code128         = (1 << 4),
	DataBar         = (1 << 5),
	DataBarExpanded = (1 << 6),
	DataMatrix      = (1 << 7),
	EAN8            = (1 << 8),
	EAN13           = (1 << 9),
	ITF             = (1 << 10),
	MaxiCode        = (1 << 11),
	PDF417          = (1 << 12),
	QRCode          = (1 << 13),
	UPCA            = (1 << 14),
	UPCE            = (1 << 15),
	MicroQRCode     = (1 << 16),
	RMQRCode        = (1 << 17),

	LinearCodes = Codabar | Code39 | Code93 | Code128 | EAN8 | EAN13 | ITF | DataBar | DataBarExpanded | UPCA | UPCE,
	MatrixCodes = Aztec | DataMatrix | MaxiCode | PDF417 | QRCode | MicroQRCode | RMQRCode,
	Any         = LinearCodes | MatrixCodes,
};

export declare function barcodeFormatToString (format: BarcodeFormat): string

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
  format: BarcodeFormat
  text: string
  error: string
  position: Position | null
}

export declare function readFromRawImage (
  /** [r, g, b, a, ...], [0-255] */
  imageData: Uint8Array,
  width: number,
  height: number,
  tryHarder: boolean,
  /** `${Format}|${Format}|...` */
  format: string
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
  getBuffer: () => Uint8Array
}

export declare function generateMatrix (
  text: string,
  format: BarcodeFormat,
  encoding: Charset,
  margin: number,
  width: number,
  height: number,
  eccLevel: EccLevel
): Matrix
