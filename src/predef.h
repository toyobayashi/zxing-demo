#ifndef SRC_PREDEF_H_
#define SRC_PREDEF_H_

#include <stdint.h>

#if defined(_M_X64) || defined(__x86_64__)
#define ARCHCPU64 1
#elif defined(_M_IX86) || defined(__i386__)
#define ARCHCPU32 1
#else
#define ARCHCPU32 1
#endif

#if defined(ARCHCPU64)
typedef int64_t pointer_number_t;
#elif defined(ARCHCPU32)
typedef int32_t pointer_number_t;
#else
typedef int pointer_number_t;
#endif

#endif  // SRC_PREDEF_H_
