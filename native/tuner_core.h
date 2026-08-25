// Pitch detection core, shared by the web build (WASM) and the native apps.
// C++ behind a C ABI: Swift imports the header directly and JNI needs no shim.
#ifndef TUNER_CORE_H
#define TUNER_CORE_H

#ifdef __cplusplus
extern "C" {
#endif

// Largest window the core will accept; every buffer below is sized from it
#define TH_MAX_FFT 8192

// Sizes the tables for this window and rate. Returns 0 if the window is not a
// power of two within range. Must be called before th_detect.
int th_init(double sample_rate, int fft_size);

// The frame goes here: fft_size floats, written in place by the caller
float *th_input(void);

// Returns the detected frequency in Hz, or -1 when the frame holds no pitch
double th_detect(void);

#ifdef __cplusplus
}
#endif

#endif
