{
  'variables': { 'target_arch%': 'ia32' }, # default for node v0.6.x

  'target_defaults': {
    'default_configuration': 'Debug',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 1, # static debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 0, # static release
          },
        },
      }
    },
    'msvs_settings': {
      'VCCLCompilerTool': {
        'ExceptionHandling': 1,
        'AdditionalOptions': ['-std:c++17', '/EHsc'],
      },
      'VCLinkerTool': {
        'GenerateDebugInformation': 'true',
      },
    },

    'cflags_cc': [
      '-std=c++17'
    ],

    'defines': [
    ],
    'include_dirs': [
      'src',
    ],
    'conditions': [
      ['OS=="mac"', {
        'xcode_settings': {
          'CLANG_CXX_LANGUAGE_STANDARD': 'c++17',
        }
      }],
      ['OS=="win"', {
        'defines': [
        ]
      }]
    ],
  },

  'targets': [

    # zxingcore
    {
      'target_name': 'zxingcore',
      'product_prefix': 'lib',
      'type': 'static_library',
      'conditions': [
        ['OS=="win"', {
          'defines': [
            '_SCL_SECURE_NO_WARNINGS',
            '_CRT_SECURE_NO_WARNINGS',
            '_CRT_NONSTDC_NO_WARNINGS',
            'NOMINMAX'
          ]
        }]
      ],
      'sources': [
        'src/BarcodeFormat.cpp',
        'src/BitArray.cpp',
        'src/BitMatrix.cpp',
        'src/BitMatrixIO.cpp',
        'src/CharacterSetECI.cpp',
        'src/ConcentricFinder.cpp',
        'src/GenericGF.cpp',
        'src/GenericGFPoly.cpp',
        'src/GTIN.cpp',
        'src/TextUtfEncoding.cpp',
        'src/ZXBigInteger.cpp',
        'src/BinaryBitmap.cpp',
        'src/BitSource.cpp',
        'src/DecodeHints.cpp',
        'src/DecodeStatus.cpp',
        'src/GenericLuminanceSource.cpp',
        'src/GlobalHistogramBinarizer.cpp',
        'src/GridSampler.cpp',
        'src/HybridBinarizer.cpp',
        'src/LuminanceSource.cpp',
        'src/MultiFormatReader.cpp',
        'src/PerspectiveTransform.cpp',
        'src/ReadBarcode.cpp',
        'src/ReedSolomonDecoder.cpp',
        'src/Result.cpp',
        'src/ResultMetadata.cpp',
        'src/ResultPoint.cpp',
        'src/TextDecoder.cpp',
        'src/WhiteRectDetector.cpp',
        'src/ReedSolomonEncoder.cpp',
        'src/TextEncoder.cpp',
        'src/MultiFormatWriter.cpp',
        'src/aztec/AZDecoder.cpp',
        'src/aztec/AZDetector.cpp',
        'src/aztec/AZReader.cpp',
        'src/aztec/AZEncoder.cpp',
        'src/aztec/AZHighLevelEncoder.cpp',
        'src/aztec/AZToken.cpp',
        'src/aztec/AZWriter.cpp',
        'src/datamatrix/DMBitLayout.cpp',
        'src/datamatrix/DMDataBlock.cpp',
        'src/datamatrix/DMDecoder.cpp',
        'src/datamatrix/DMDetector.cpp',
        'src/datamatrix/DMVersion.cpp',
        'src/datamatrix/DMReader.cpp',
        'src/datamatrix/DMECEncoder.cpp',
        'src/datamatrix/DMHighLevelEncoder.cpp',
        'src/datamatrix/DMSymbolInfo.cpp',
        'src/datamatrix/DMWriter.cpp',
        'src/maxicode/MCBitMatrixParser.cpp',
        'src/maxicode/MCDecoder.cpp',
        'src/maxicode/MCReader.cpp',
        'src/oned/ODUPCEANCommon.cpp',
        'src/oned/ODCode128Patterns.cpp',
        'src/oned/ODCodabarReader.cpp',
        'src/oned/ODCode39Reader.cpp',
        'src/oned/ODCode93Reader.cpp',
        'src/oned/ODCode128Reader.cpp',
        'src/oned/ODDataBarCommon.cpp',
        'src/oned/ODDataBarReader.cpp',
        'src/oned/ODDataBarExpandedReader.cpp',
        'src/oned/ODITFReader.cpp',
        'src/oned/ODMultiUPCEANReader.cpp',
        'src/oned/ODReader.cpp',
        'src/oned/ODRowReader.cpp',
        'src/oned/ODCodabarWriter.cpp',
        'src/oned/ODCode39Writer.cpp',
        'src/oned/ODCode93Writer.cpp',
        'src/oned/ODCode128Writer.cpp',
        'src/oned/ODEAN8Writer.cpp',
        'src/oned/ODEAN13Writer.cpp',
        'src/oned/ODITFWriter.cpp',
        'src/oned/ODUPCEWriter.cpp',
        'src/oned/ODUPCAWriter.cpp',
        'src/oned/ODWriterHelper.cpp',
        'src/oned/rss/ODRSSExpandedBinaryDecoder.cpp',
        'src/oned/rss/ODRSSFieldParser.cpp',
        'src/oned/rss/ODRSSGenericAppIdDecoder.cpp',
        'src/pdf417/PDFBarcodeValue.cpp',
        'src/pdf417/PDFBoundingBox.cpp',
        'src/pdf417/PDFCodewordDecoder.cpp',
        'src/pdf417/PDFDecodedBitStreamParser.cpp',
        'src/pdf417/PDFDetectionResult.cpp',
        'src/pdf417/PDFDetectionResultColumn.cpp',
        'src/pdf417/PDFDetector.cpp',
        'src/pdf417/PDFModulusGF.cpp',
        'src/pdf417/PDFModulusPoly.cpp',
        'src/pdf417/PDFReader.cpp',
        'src/pdf417/PDFScanningDecoder.cpp',
        'src/pdf417/PDFEncoder.cpp',
        'src/pdf417/PDFHighLevelEncoder.cpp',
        'src/pdf417/PDFWriter.cpp',
        'src/qrcode/QRCodecMode.cpp',
        'src/qrcode/QRErrorCorrectionLevel.cpp',
        'src/qrcode/QRVersion.cpp',
        'src/qrcode/QRBitMatrixParser.cpp',
        'src/qrcode/QRDataBlock.cpp',
        'src/qrcode/QRDecoder.cpp',
        'src/qrcode/QRDetector.cpp',
        'src/qrcode/QRFormatInformation.cpp',
        'src/qrcode/QRReader.cpp',
        'src/qrcode/QREncoder.cpp',
        'src/qrcode/QRMaskUtil.cpp',
        'src/qrcode/QRMatrixUtil.cpp',
        'src/qrcode/QRWriter.cpp',
        'src/textcodec/Big5MapTable.cpp',
        'src/textcodec/KRHangulMapping.cpp',
        'src/textcodec/Big5TextDecoder.cpp',
        'src/textcodec/GBTextDecoder.cpp',
        'src/textcodec/JPTextDecoder.cpp',
        'src/textcodec/KRTextDecoder.cpp',
        'src/textcodec/Big5TextEncoder.cpp',
        'src/textcodec/GBTextEncoder.cpp',
        'src/textcodec/JPTextEncoder.cpp',
        'src/textcodec/KRTextEncoder.cpp',
      ],
      'direct_dependent_settings': {
        'include_dirs': [
          'src',
        ],
      },
    }
  ]
}
