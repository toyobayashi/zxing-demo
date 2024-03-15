#include "Matrix.hpp"
#include "BitMatrix.h"

namespace zxingwasm {

void Matrix::Init(Napi::Env env) {
  Napi::Function func = DefineClass(env, "ZXingMatrix", {
    InstanceMethod<&Matrix::GetDataAddress>("getDataAddress",
      static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Matrix::GetDataSize>("getDataSize",
      static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Matrix::GetWidth>("getWidth",
      static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Matrix::GetHeight>("getHeight",
      static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Matrix::GetBuffer>("getBuffer",
      static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Matrix::Destroy>("destroy",
      static_cast<napi_property_attributes>(napi_writable | napi_configurable))
  });

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData<Napi::FunctionReference>(constructor);
}

Matrix::Matrix(const Napi::CallbackInfo& info):
  Napi::ObjectWrap<Matrix>(info),
  value_(info[0].As<Napi::External<ZXing::Matrix<uint8_t>>>().Data()) {}

void Matrix::Finalize(Napi::Env env) {
  if (value_ != nullptr) {
    delete value_;
    value_ = nullptr;
  }
}

#define MATRIX_CHECK(env) \
  do { \
    if (value_ == nullptr) { \
      Napi::Error::New((env), "Accessing destroyed Matrix object") \
        .ThrowAsJavaScriptException(); \
      return Napi::Value(); \
    } \
  } while (0)

Napi::Value Matrix::GetDataAddress(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  MATRIX_CHECK(env);
  return Napi::Number::New(env,
    reinterpret_cast<size_t>(value_->data()));
}

Napi::Value Matrix::GetDataSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  MATRIX_CHECK(env);
  return Napi::Number::New(env, value_->size());
}

Napi::Value Matrix::GetWidth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  MATRIX_CHECK(env);
  return Napi::Number::New(env, value_->width());
}

Napi::Value Matrix::GetHeight(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  MATRIX_CHECK(env);
  return Napi::Number::New(env, value_->height());
}

Napi::Value Matrix::GetBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  MATRIX_CHECK(env);
  size_t len = value_->size();
  Napi::ArrayBuffer ab = Napi::ArrayBuffer::New(env,
    const_cast<uint8_t*>(value_->data()),
    len);
  return Napi::Uint8Array::New(env, len, ab, 0, napi_uint8_array);
}

Napi::Value Matrix::Destroy(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Finalize(env);
  return env.Undefined();
}

}  // namespace zxingwasm
