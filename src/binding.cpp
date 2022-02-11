#include <cstring>
#include <string>

#include "predef.h"
#include "Matrix.hpp"
#include "ReadBarcode.h"

#include "BarcodeFormat.h"
#include "MultiFormatWriter.h"
#include "CharacterSetECI.h"

namespace zxingwasm {

struct ReadResult {
  std::string format;
  std::wstring text;
  std::string error;
  ZXing::Position position;
};

inline Napi::Value ConvertResultToObject(Napi::Env env,
                                         const ReadResult& result) {
  Napi::Object js_result = Napi::Object::New(env);
  js_result["format"] = Napi::String::New(env, result.format);
  js_result["text"] = Napi::String::New(env,
    std::u16string(result.text.begin(), result.text.end()));
  js_result["error"] = Napi::String::New(env, result.error);

  if (result.error.empty() && !result.format.empty()) {
    Napi::Array js_position = Napi::Array::New(env, 4);
    Napi::Object js_top_left = Napi::Object::New(env);
    js_top_left["x"] = result.position[0].x;
    js_top_left["y"] = result.position[0].y;
    js_position[0U] = js_top_left;

    Napi::Object js_top_right = Napi::Object::New(env);
    js_top_right["x"] = result.position[1].x;
    js_top_right["y"] = result.position[1].y;
    js_position[1U] = js_top_right;

    Napi::Object js_bottom_right = Napi::Object::New(env);
    js_bottom_right["x"] = result.position[2].x;
    js_bottom_right["y"] = result.position[2].y;
    js_position[2U] = js_bottom_right;

    Napi::Object js_bottom_left = Napi::Object::New(env);
    js_bottom_left["x"] = result.position[3].x;
    js_bottom_left["y"] = result.position[3].y;
    js_position[3U] = js_bottom_left;

    js_result["position"] = js_position;
  } else {
    js_result["position"] = env.Null();
  }

  return js_result;
}

Napi::Value JsReadBarcodeFromImage(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Uint8Array u8arr = info[0].As<Napi::Uint8Array>();
  int width = info[1].As<Napi::Number>().Uint32Value();
  int height = info[2].As<Napi::Number>().Uint32Value();
  bool tryHarder = info[3].As<Napi::Boolean>().Value();
  std::string format = info[4].As<Napi::String>().Utf8Value();

  try {
    ZXing::DecodeHints hints;
    hints.setTryHarder(tryHarder);
    hints.setTryRotate(tryHarder);
    hints.setFormats(ZXing::BarcodeFormatsFromString(format));

    ZXing::ImageView view(u8arr.Data(),
      width, height, ZXing::ImageFormat::RGBX);
    ZXing::Result result = ZXing::ReadBarcode(view, hints);
    return ConvertResultToObject(env, {
      ZXing::ToString(result.format()),
      result.text(),
      result.isValid() ? "" : ZXing::ToString(result.status()),
      result.position()
    });
  } catch (const std::exception& e) {
    return ConvertResultToObject(env, { "", L"", e.what() });
  } catch (...) {
    return ConvertResultToObject(env, { "", L"", "Unknown error" });
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
  int eccLevel = info[6].As<Napi::Number>().Uint32Value();

  try {
    ZXing::BarcodeFormat barcodeFormat = ZXing::BarcodeFormatFromString(format);
    if (barcodeFormat == ZXing::BarcodeFormat::None) {
      Napi::TypeError::New(env, "Unsupported format: " + format)
        .ThrowAsJavaScriptException();
      return Napi::Value();
    }

    ZXing::MultiFormatWriter writer(barcodeFormat);
    if (margin >= 0)
      writer.setMargin(margin);

    ZXing::CharacterSet charset =
      ZXing::CharacterSetECI::CharsetFromName(encoding.c_str());
    if (charset != ZXing::CharacterSet::Unknown)
      writer.setEncoding(charset);

    if (eccLevel >= 0 && eccLevel <= 8)
      writer.setEccLevel(eccLevel);

    ZXing::Matrix<uint8_t>* buffer = new ZXing::Matrix<uint8_t>(
      ZXing::ToMatrix<uint8_t>(writer.encode(
        std::wstring(text.begin(), text.end()), width, height)));

    Napi::FunctionReference* constructor =
      env.GetInstanceData<Napi::FunctionReference>();
    return constructor->New({
      Napi::Number::New(env, reinterpret_cast<pointer_number_t>(buffer)) });
  } catch (const Napi::Error& e) {
    e.ThrowAsJavaScriptException();
    return Napi::Value();
  } catch (const std::exception& e) {
    Napi::Error::New(env, e.what())
      .ThrowAsJavaScriptException();
    return Napi::Value();
  } catch (...) {
    Napi::Error::New(env, "Unknown error")
      .ThrowAsJavaScriptException();
    return Napi::Value();
  }
}

}  // namespace zxingwasm

namespace {

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  zxingwasm::Matrix::Init(env);
  exports["readBarcodeFromImage"] = Napi::Function::New(env,
    zxingwasm::JsReadBarcodeFromImage, "readBarcodeFromImage");
  exports["generateBarcode"] = Napi::Function::New(env,
    zxingwasm::JsGenerateBarcode, "generateBarcode");
  return exports;
}

}  // namespace

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
