#include <cstring>
#include <string>

#include "Matrix.hpp"
#include "BitMatrix.h"
#include "ReadBarcode.h"
#include "TextUtfEncoding.h"
#include "BarcodeFormat.h"
#include "MultiFormatWriter.h"
#include "CharacterSet.h"

namespace zxingwasm {

inline Napi::Value ConvertResultToObject(Napi::Env env,
                                         ZXing::BarcodeFormat format,
                                         const std::string& text,
                                         const std::string& error,
                                         const ZXing::Position& position) {
  Napi::Object js_result = Napi::Object::New(env);
  js_result["format"] = Napi::Number::New(env, static_cast<std::underlying_type_t<ZXing::BarcodeFormat>>(format));
  js_result["text"] = Napi::String::New(env, text);
  js_result["error"] = Napi::String::New(env, error);

  if (error.empty() && format != ZXing::BarcodeFormat::None) {
    Napi::Array js_position = Napi::Array::New(env, 4);
    Napi::Object js_top_left = Napi::Object::New(env);
    js_top_left["x"] = position[0].x;
    js_top_left["y"] = position[0].y;
    js_position[0U] = js_top_left;

    Napi::Object js_top_right = Napi::Object::New(env);
    js_top_right["x"] = position[1].x;
    js_top_right["y"] = position[1].y;
    js_position[1U] = js_top_right;

    Napi::Object js_bottom_right = Napi::Object::New(env);
    js_bottom_right["x"] = position[2].x;
    js_bottom_right["y"] = position[2].y;
    js_position[2U] = js_bottom_right;

    Napi::Object js_bottom_left = Napi::Object::New(env);
    js_bottom_left["x"] = position[3].x;
    js_bottom_left["y"] = position[3].y;
    js_position[3U] = js_bottom_left;

    js_result["position"] = js_position;
  } else {
    js_result["position"] = env.Null();
  }

  return js_result;
}

Napi::Value JsReadFromRawImage(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Uint8Array u8arr = info[0].As<Napi::Uint8Array>();
  int width = info[1].As<Napi::Number>().Uint32Value();
  int height = info[2].As<Napi::Number>().Uint32Value();
  bool tryHarder = info[3].As<Napi::Boolean>().Value();
  std::string format = info[4].As<Napi::String>().Utf8Value();

  try {
    ZXing::ReaderOptions options;
    options.setTryHarder(tryHarder);
    options.setTryRotate(tryHarder);
    options.setFormats(ZXing::BarcodeFormatsFromString(format));

    ZXing::ImageView view(u8arr.Data(),
      width, height, ZXing::ImageFormat::RGBX);
    ZXing::Result result = ZXing::ReadBarcode(view, options);
    return ConvertResultToObject(env,
      result.format(),
      result.text(),
      result.isValid() ? "" : ZXing::ToString(result.error()),
      result.position());
  } catch (const Napi::Error& e) {
    e.ThrowAsJavaScriptException();
  } catch (const std::exception& e) {
    Napi::Error::New(env, e.what())
      .ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error")
      .ThrowAsJavaScriptException();
  }
  return Napi::Value();
}

Napi::Value JsGenerateMatrix(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::string text = info[0].As<Napi::String>().Utf8Value();
  ZXing::BarcodeFormat barcodeFormat = static_cast<ZXing::BarcodeFormat>(info[1].As<Napi::Number>().Int32Value());
  std::string encoding = info[2].As<Napi::String>().Utf8Value();
  int margin = info[3].As<Napi::Number>().Uint32Value();
  int width = info[4].As<Napi::Number>().Uint32Value();
  int height = info[5].As<Napi::Number>().Uint32Value();
  int eccLevel = info[6].As<Napi::Number>().Uint32Value();

  try {
    if (barcodeFormat == ZXing::BarcodeFormat::None) {
      Napi::TypeError::New(env, "Unsupported format: None")
        .ThrowAsJavaScriptException();
      return Napi::Value();
    }

    ZXing::MultiFormatWriter writer(barcodeFormat);
    if (margin >= 0)
      writer.setMargin(margin);

    ZXing::CharacterSet charset =
      ZXing::CharacterSetFromString(encoding.c_str());
    if (charset != ZXing::CharacterSet::Unknown)
      writer.setEncoding(charset);

    if (eccLevel >= 0 && eccLevel <= 8)
      writer.setEccLevel(eccLevel);

    ZXing::Matrix<uint8_t>* buffer = new ZXing::Matrix<uint8_t>(
      ZXing::ToMatrix<uint8_t>(writer.encode(
        text, width, height)));

    Napi::FunctionReference* constructor =
      env.GetInstanceData<Napi::FunctionReference>();

    return constructor->New({
      Napi::External<ZXing::Matrix<uint8_t>>::New(env, buffer)
    });
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

constexpr const ZXing::BarcodeFormat formats[] = {
	ZXing::BarcodeFormat::None,
	ZXing::BarcodeFormat::Aztec,
	ZXing::BarcodeFormat::Codabar,
	ZXing::BarcodeFormat::Code39,
	ZXing::BarcodeFormat::Code93,
	ZXing::BarcodeFormat::Code128,
	ZXing::BarcodeFormat::DataBar,
	ZXing::BarcodeFormat::DataBarExpanded,
	ZXing::BarcodeFormat::DataMatrix,
	ZXing::BarcodeFormat::EAN8,
	ZXing::BarcodeFormat::EAN13,
	ZXing::BarcodeFormat::ITF,
	ZXing::BarcodeFormat::MaxiCode,
	ZXing::BarcodeFormat::PDF417,
	ZXing::BarcodeFormat::QRCode,
	ZXing::BarcodeFormat::UPCA,
	ZXing::BarcodeFormat::UPCE,
	ZXing::BarcodeFormat::MicroQRCode,
	ZXing::BarcodeFormat::RMQRCode,
	ZXing::BarcodeFormat::LinearCodes,
	ZXing::BarcodeFormat::MatrixCodes,
	ZXing::BarcodeFormat::Any
};

inline Napi::Object BindBarcodeFormat(Napi::Env env) {
  Napi::Object format = Napi::Object::New(env);

  std::for_each(formats, formats + sizeof(formats) / sizeof(formats[0]), [=](ZXing::BarcodeFormat fmt) {
    Napi::Number value = Napi::Number::New(env, static_cast<std::underlying_type_t<ZXing::BarcodeFormat>>(fmt));
    std::string fmt_name =
      fmt == ZXing::BarcodeFormat::Any
        ? std::string("Any")
        : fmt == ZXing::BarcodeFormat::RMQRCode
          ? std::string("RMQRCode")
          : ZXing::ToString(fmt);
    fmt_name.erase(std::remove_if(fmt_name.begin(), fmt_name.end(), [](char c) { return c == '-'; }), fmt_name.end());
    Napi::String name = Napi::String::New(env, fmt_name);
    format[format[name] = value] = name;
  });

  return format;
}

Napi::Value JsFormatToString(const Napi::CallbackInfo& info) {
  if (info.Length() == 0) return Napi::String::New(info.Env(), "");
  ZXing::BarcodeFormat fmt = static_cast<ZXing::BarcodeFormat>(info[0].As<Napi::Number>().Int32Value());
  return Napi::String::New(info.Env(), ZXing::ToString(fmt));
}

}  // namespace zxingwasm

namespace {

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  zxingwasm::Matrix::Init(env);
  exports["readFromRawImage"] = Napi::Function::New(env,
    zxingwasm::JsReadFromRawImage, "readFromRawImage");
  exports["generateMatrix"] = Napi::Function::New(env,
    zxingwasm::JsGenerateMatrix, "generateMatrix");
  exports["BarcodeFormat"] = zxingwasm::BindBarcodeFormat(env);
  exports["barcodeFormatToString"] = Napi::Function::New(env,
    zxingwasm::JsFormatToString, "barcodeFormatToString");
  return exports;
}

}  // namespace

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
