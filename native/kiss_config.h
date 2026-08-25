// Forced ahead of the vendored KissFFT sources, so those stay byte-identical to
// the copy the SLM framework ships and can be re-synced without a merge.
#ifndef TH_KISS_CONFIG_H
#define TH_KISS_CONFIG_H

#include <stdio.h>
#include <stdlib.h>

// KissFFT reports misuse on stderr, which would pull WASI stdio into a module
// that otherwise imports nothing at all
#define fprintf(...) ((void)0)
#define exit(code) __builtin_trap()

#endif
