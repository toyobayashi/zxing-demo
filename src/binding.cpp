#include <cstring>
#include <string>
#ifdef __EMSCRIPTEN__
#include "emnapi.h"
#endif
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

ReadResult ReadBarcodeFromImage(const uint8_t* buffer_ptr,
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

    ImageView view(buffer_ptr, width, height, ImageFormat::RGBX);
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
  Napi::Uint8Array u8arr = info[0].As<Napi::Uint8Array>();
  int width = info[1].As<Napi::Number>().Uint32Value();
  int height = info[2].As<Napi::Number>().Uint32Value();
  bool tryHarder = info[3].As<Napi::Boolean>().Value();
  std::string format = info[4].As<Napi::String>().Utf8Value();

  ReadResult result = ReadBarcodeFromImage(u8arr.Data(),
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

  if (result.error.empty() && !result.format.empty()) {
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
  } else {
    js_result["position"] = env.Null();
  }

  return js_result;
}

struct WriteResult {
  const ZXing::Matrix<uint8_t>* matrix;
  const uint8_t* buffer;
  int length;
  std::string error;
  WriteResult(const ZXing::Matrix<uint8_t>* m,
              const uint8_t* b,
              int l,
              std::string err):
    matrix(m), buffer(b), length(l), error(std::move(err)) {}
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
      return WriteResult(nullptr, nullptr, 0, "Unsupported format: " + format);

    MultiFormatWriter writer(barcodeFormat);
    if (margin >= 0)
      writer.setMargin(margin);

    CharacterSet charset =
      ZXing::CharacterSetECI::CharsetFromName(encoding.c_str());
    if (charset != CharacterSet::Unknown)
      writer.setEncoding(charset);

    if (eccLevel >= 0 && eccLevel <= 8)
      writer.setEccLevel(eccLevel);

    ZXing::Matrix<uint8_t>* buffer = new ZXing::Matrix<uint8_t>(
      ToMatrix<uint8_t>(writer.encode(text, width, height)));

    return WriteResult(buffer, buffer->data(), buffer->size(), "");
  } catch (const std::exception& e) {
    return WriteResult(nullptr, nullptr, 0, e.what());
  } catch (...) {
    return WriteResult(nullptr, nullptr, 0, "Unknown error");
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
  js_result["matrix"] = Napi::Number::New(env,
    reinterpret_cast<int32_t>(result.matrix));
  js_result["buffer"] = Napi::Number::New(env,
    reinterpret_cast<int32_t>(result.buffer));
  js_result["length"] = Napi::Number::New(env, result.length);
  js_result["error"] = Napi::String::New(env, result.error);

  return js_result;
}

Napi::Value ReleaseMatrix(const Napi::CallbackInfo& info) {
  auto p = reinterpret_cast<ZXing::Matrix<uint8_t>*>(
    info[0].As<Napi::Number>().Uint32Value());
  if (p != nullptr) delete p;
  return info.Env().Undefined();
}

Napi::Value GetUint8Array(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
#ifdef __EMSCRIPTEN__
  napi_value b;
  napi_status r = emnapi_create_external_uint8array(env,
    reinterpret_cast<void*>(info[0].As<Napi::Number>().Uint32Value()),
    info[1].As<Napi::Number>().Uint32Value(), nullptr, nullptr, &b);
  if (r != napi_ok) {
    Napi::Error err = env.GetAndClearPendingException();
    err.ThrowAsJavaScriptException();
    return Napi::Value();
  }
  return Napi::Value(env, b);
#else
  size_t len = info[1].As<Napi::Number>().Uint32Value();
  Napi::ArrayBuffer ab = Napi::ArrayBuffer::New(env,
    reinterpret_cast<void*>(info[0].As<Napi::Number>().Uint32Value()),
    len);
  return Napi::Uint8Array::New(env, len, ab, 0, napi_uint8_array);
#endif
}

}  // namespace zxingwasm

namespace {

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["readBarcodeFromImage"] = Napi::Function::New(env,
    zxingwasm::JsReadBarcodeFromImage, "readBarcodeFromImage");
  exports["generateBarcode"] = Napi::Function::New(env,
    zxingwasm::JsGenerateBarcode, "generateBarcode");
  exports["getUint8Array"] = Napi::Function::New(env,
    zxingwasm::GetUint8Array, "getUint8Array");
  exports["releaseMatrix"] = Napi::Function::New(env,
    zxingwasm::ReleaseMatrix, "releaseMatrix");
  return exports;
}

}  // namespace

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
