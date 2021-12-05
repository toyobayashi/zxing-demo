#include <cstring>
#include <cstdlib>
#include <string>
#include "napi.h"
#include "ReadBarcode.h"

#include "BarcodeFormat.h"
#include "MultiFormatWriter.h"
#include "BitMatrix.h"
#include "CharacterSetECI.h"

namespace zxingwasm {

struct ReadResult {
  std::string format;
  std::wstring text;
  std::string error;
  ZXing::Position position;
};

ReadResult ReadBarcodeFromImage(int buffer_ptr,
                                int buffer_length,
                                int width,
                                int height,
                                bool tryHarder,
                                std::string format) {
  using ZXing::DecodeHints;
  using ZXing::BarcodeFormatsFromString;
  using ZXing::ReadBarcode;
  using ZXing::ToString;
  using ZXing::ImageFormat;
  using ZXing::ImageView;

  try {
    DecodeHints hints;
    hints.setTryHarder(tryHarder);
    hints.setTryRotate(tryHarder);
    hints.setFormats(BarcodeFormatsFromString(format));

    int channels;

    ImageView view(reinterpret_cast<const uint8_t*>(buffer_ptr),
                   width, height, ImageFormat::RGBX);
    auto result = ReadBarcode(view, hints);
    if (result.isValid()) {
      return {
        ToString(result.format()),
        result.text(),
        "",
        result.position()
      };
    }
  }
  catch (const std::exception& e) {
    return { "", L"", e.what() };
  }
  catch (...) {
    return { "", L"", "Unknown error" };
  }
  return {};
}

Napi::Value JsReadBarcodeFromImage(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  int buffer_ptr = info[0].As<Napi::Number>().Uint32Value();
  int buffer_length = info[1].As<Napi::Number>().Uint32Value();
  int width = info[2].As<Napi::Number>().Uint32Value();
  int height = info[3].As<Napi::Number>().Uint32Value();
  bool tryHarder = info[4].As<Napi::Boolean>().Value();
  std::string format = info[5].As<Napi::String>().Utf8Value();

  ReadResult result = ReadBarcodeFromImage(buffer_ptr, buffer_length,
    width, height, tryHarder, format);

  std::u16string text;
  auto len = result.text.length();
  for (size_t i = 0; i < len; i++) {
    text += { static_cast<char16_t>(result.text[i]) };
  }

  Napi::Object js_result = Napi::Object::New(env);
  js_result["format"] = Napi::String::New(env, result.format);
  js_result["text"] = Napi::String::New(env, text);
  js_result["error"] = Napi::String::New(env, result.error);

  Napi::Object js_position = Napi::Object::New(env);
  Napi::Object js_top_left = Napi::Object::New(env);
  js_top_left["x"] = result.position[0].x;
  js_top_left["y"] = result.position[0].y;
  js_position["topLeft"] = js_top_left;

  Napi::Object js_top_right = Napi::Object::New(env);
  js_top_right["x"] = result.position[1].x;
  js_top_right["y"] = result.position[1].y;
  js_position["topRight"] = js_top_right;

  Napi::Object js_bottom_right = Napi::Object::New(env);
  js_bottom_right["x"] = result.position[2].x;
  js_bottom_right["y"] = result.position[2].y;
  js_position["bottomRight"] = js_bottom_right;

  Napi::Object js_bottom_left = Napi::Object::New(env);
  js_bottom_left["x"] = result.position[3].x;
  js_bottom_left["y"] = result.position[3].y;
  js_position["bottomLeft"] = js_bottom_left;

  js_result["position"] = js_position;

  return js_result;
}

struct WriteResult {
  uint8_t* buffer;
  int length;
  std::string error;
  WriteResult(uint8_t* b, int l, std::string err):
    buffer(b), length(l), error(std::move(err)) {}
};

WriteResult GenerateBarcode(std::wstring text,
                            std::string format,
                            std::string encoding,
                            int margin,
                            int width,
                            int height,
                            int eccLevel) {
  using ZXing::BarcodeFormatFromString;
  using ZXing::BarcodeFormat;
  using ZXing::MultiFormatWriter;
  using ZXing::CharacterSet;
  using ZXing::ToMatrix;
  try {
    auto barcodeFormat = BarcodeFormatFromString(format);
    if (barcodeFormat == BarcodeFormat::None)
      return WriteResult(nullptr, 0, "Unsupported format: " + format);

    MultiFormatWriter writer(barcodeFormat);
    if (margin >= 0)
      writer.setMargin(margin);

    CharacterSet charset =
      ZXing::CharacterSetECI::CharsetFromName(encoding.c_str());
    if (charset != CharacterSet::Unknown)
      writer.setEncoding(charset);

    if (eccLevel >= 0 && eccLevel <= 8)
      writer.setEccLevel(eccLevel);

    ZXing::Matrix<uint8_t> buffer =
      ToMatrix<uint8_t>(writer.encode(text, width, height));
    uint8_t* buf = static_cast<uint8_t*>(::malloc(buffer.size()));
    ::memcpy(buf, buffer.data(), buffer.size());

    return WriteResult(buf, buffer.size(), "");
  } catch (const std::exception& e) {
    return WriteResult(nullptr, 0, e.what());
  } catch (...) {
    return WriteResult(nullptr, 0, "Unknown error");
  }
}

Napi::Value JsGenerateBarcode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::u16string text = info[0].As<Napi::String>().Utf16Value();
  std::string format = info[1].As<Napi::String>().Utf8Value();
  std::string encoding = info[2].As<Napi::String>().Utf8Value();
  int margin = info[3].As<Napi::Number>().Uint32Value();
  int width = info[4].As<Napi::Number>().Uint32Value();
  int height = info[5].As<Napi::Number>().Uint32Value();
  bool eccLevel = info[6].As<Napi::Number>().Uint32Value();

  std::wstring t;
  auto len = text.length();
  for (size_t i = 0; i < len; i++) {
    t += { static_cast<wchar_t>(text[i]) };
  }

  WriteResult result = GenerateBarcode(t,
                                       format,
                                       encoding,
                                       margin,
                                       width,
                                       height,
                                       eccLevel);

  Napi::Object js_result = Napi::Object::New(env);
  js_result["buffer"] = Napi::Number::New(env,
    reinterpret_cast<int32_t>(result.buffer));
  js_result["length"] = Napi::Number::New(env, result.length);
  js_result["error"] = Napi::String::New(env, result.error);

  return js_result;
}

Napi::Value ReleaseImage(const Napi::CallbackInfo& info) {
  ::free(reinterpret_cast<uint8_t*>(info[0].As<Napi::Number>().Uint32Value()));
  return info.Env().Undefined();
}

}  // namespace zxingwasm

namespace {

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["readBarcodeFromImage"] = Napi::Function::New(env,
    zxingwasm::JsReadBarcodeFromImage, "readBarcodeFromImage");
  exports["generateBarcode"] = Napi::Function::New(env,
    zxingwasm::JsGenerateBarcode, "generateBarcode");
  exports["releaseImage"] = Napi::Function::New(env,
    zxingwasm::ReleaseImage, "releaseImage");
  return exports;
}

}  // namespace

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
