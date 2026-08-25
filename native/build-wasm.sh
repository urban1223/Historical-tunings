#!/bin/sh
# Builds the detection core to the WASM the page loads. The artifact is committed,
# because deploys are a git-ftp push and there is no build step on the server.
#
#   SIMD=1 ./native/build-wasm.sh     f32x4, needs Safari 16.4
#   VERBOSE=1 ./native/build-wasm.sh  print which loops vectorized
set -e

WASI_SDK="${WASI_SDK:-$HOME/.local/wasi-sdk-34.0-arm64-macos}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${OUT:-$ROOT/tuner-core.wasm}"
KISS="$ROOT/native/kissfft"

[ -x "$WASI_SDK/bin/clang++" ] || { echo "wasi-sdk not found at $WASI_SDK" >&2; exit 1; }

# SIMD is worth a few percent, which is not worth the version floor it would put
# under the app; -O3 vectorizes what it can either way
[ "${SIMD:-0}" = "1" ] && SIMD_FLAGS="-msimd128" || SIMD_FLAGS=""

# Vectorization remarks are noisy, so they are opt-in
[ "${VERBOSE:-0}" = "1" ] && REPORT="-Rpass=loop-vectorize" || REPORT=""

# No exceptions, no RTTI and no libc++: nothing here needs any of the three, and
# leaving them out is what keeps the module free of imports
"$WASI_SDK/bin/clang++" \
    --target=wasm32-wasip1 -mexec-model=reactor \
    -O3 $SIMD_FLAGS $REPORT \
    -fno-exceptions -fno-rtti -nostdlib++ \
    -include "$ROOT/native/kiss_config.h" \
    -I"$KISS" \
    -ffunction-sections -fdata-sections \
    -Wall -Wextra -Wno-unneeded-internal-declaration \
    -Wl,--gc-sections -Wl,--strip-all -Wl,--no-entry \
    -Wl,--export=th_init -Wl,--export=th_detect -Wl,--export=th_input \
    -o "$OUT" \
    "$ROOT/native/tuner_core.cpp" "$KISS/kiss_fft.cpp" "$KISS/kiss_fftr.cpp"

ls -l "$OUT" | awk '{print $5" bytes  "$9}'
