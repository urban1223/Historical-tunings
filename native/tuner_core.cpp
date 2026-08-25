#include "tuner_core.h"
#include "kissfft/include/kiss_fftr.h"
#include <math.h>

#define MIN_HZ 36.0
#define MAX_HZ 2200.0
#define CLARITY_MIN 0.5
#define PEAK_FACTOR 0.9

// Lobes are set by the top partial, not the fundamental: the 5kHz lowpass over
// MIN_HZ gives 139, and 192 leaves room to move either
#define MAX_PEAKS 192

// A real transform of TH_MAX_FFT points asks for 82196 bytes; the rest is slack
#define CFG_BYTES 131072

static float input[TH_MAX_FFT];
static float padded[TH_MAX_FFT];    // the first half of the frame, zero beyond it
static float corr[TH_MAX_FFT];      // r(t), the correlation at every lag
static kiss_fft_cpx spec_a[TH_MAX_FFT / 2 + 1], spec_b[TH_MAX_FFT / 2 + 1];
static double nsdf[TH_MAX_FFT / 2 + 2];

// A running total over the whole frame, so this one stays double regardless
static double prefix_sq[TH_MAX_FFT + 1];

static char fwd_mem[CFG_BYTES], inv_mem[CFG_BYTES];
static kiss_fftr_cfg fwd = 0, inv = 0;

struct peak { int lag; double value; };
static struct peak peaks[MAX_PEAKS];

static double rate = 0;
static int win = 0, half = 0, min_lag = 0, max_lag = 0;

float *th_input(void) { return input; }

int th_init(double sample_rate, int fft_size) {
    if (fft_size < 4 || fft_size > TH_MAX_FFT || (fft_size & (fft_size - 1))) return 0;
    if (!(sample_rate > 0)) return 0;

    // Fails rather than allocates if the window ever outgrows the static buffers
    size_t len = sizeof(fwd_mem);
    fwd = kiss_fftr_alloc(fft_size, 0, fwd_mem, &len);
    len = sizeof(inv_mem);
    inv = kiss_fftr_alloc(fft_size, 1, inv_mem, &len);
    if (!fwd || !inv) return 0;

    rate = sample_rate;
    win = fft_size;
    half = fft_size / 2;

    // The lag window the frequency range maps to; the cap keeps half + max_lag
    // inside the frame, so no wrapped lag is ever read back
    min_lag = (int)floor(sample_rate / MAX_HZ);
    if (min_lag < 2) min_lag = 2;
    max_lag = (int)ceil(sample_rate / MIN_HZ);
    if (max_lag > half - 1) max_lag = half - 1;

    return 1;
}

// Running sum of squares; the NSDF denominator is the difference of two of these
static void energy_prefix(void) {
    prefix_sq[0] = 0;
    for (int i = 0; i < win; i++) prefix_sq[i + 1] = prefix_sq[i] + (double)input[i] * input[i];
}

// r(t) for every lag at once: the first half correlated against the whole frame.
// Both sequences are real, so each transform costs about half of what the same
// window would cost run through a complex one.
static void cross_correlate(void) {
    for (int i = 0; i < half; i++) padded[i] = input[i];
    for (int i = half; i < win; i++) padded[i] = 0.0f;

    kiss_fftr(fwd, padded, spec_a);
    kiss_fftr(fwd, input, spec_b);

    // conj(A)B, so the inverse gives correlation rather than convolution. This
    // KissFFT normalises inside the inverse, so no factor of the window is needed.
    for (int i = 0; i <= half; i++) {
        const float a = spec_a[i].r, b = spec_a[i].i;
        const float c = spec_b[i].r, d = spec_b[i].i;
        spec_a[i].r = a * c + b * d;
        spec_a[i].i = a * d - b * c;
    }
    kiss_fftri(inv, spec_a, corr);
}

// n'(t) = 2r(t) / m(t), where m is the energy of both windows. Dividing by the
// energy of the same samples that produced r leaves a value in [-1, 1] that
// carries neither the signal's level nor the taper a raw correlation would have.
static void build_nsdf(void) {
    const double head = prefix_sq[half];
    for (int t = 0; t <= max_lag; t++) {
        const double m = head + (prefix_sq[t + half] - prefix_sq[t]);
        nsdf[t] = m > 0 ? 2.0 * corr[t] / m : 0.0;
    }
}

// Key maxima: the highest point of each region where the NSDF is positive. The
// region at lag 0 is the trivial self-match, so it is stepped over first.
static int find_peaks(void) {
    int count = 0, t = 0;
    while (t <= max_lag && nsdf[t] > 0) t++;

    while (t <= max_lag && count < MAX_PEAKS) {
        while (t <= max_lag && nsdf[t] <= 0) t++;
        if (t > max_lag) break;

        int best = t;
        while (t <= max_lag && nsdf[t] > 0) {
            if (nsdf[t] > nsdf[best]) best = t;
            t++;
        }
        peaks[count].lag = best;
        peaks[count].value = nsdf[best];
        count++;
    }
    return count;
}

// Parabola through the peak and its two neighbours, so the period is not
// quantised to whole samples
static double refine_lag(int lag) {
    if (lag <= 0 || lag >= max_lag) return lag;
    const double y0 = nsdf[lag - 1], y1 = nsdf[lag], y2 = nsdf[lag + 1];
    const double denom = 2 * y1 - y0 - y2;
    return denom != 0 ? lag + 0.5 * (y2 - y0) / denom : lag;
}

// MPM (McLeod Pitch Method). Normalizing each lag by its own energy holds
// accuracy while a note decays, and yields the clarity value used as the gate.
// Clarity carries the decision on its own: room noise is broadband and fails it at
// any level, so nothing here is rejected for being quiet.
double th_detect(void) {
    if (win == 0) return -1;

    energy_prefix();
    if (prefix_sq[half] <= 0) return -1;    // all-zero frame: nothing to normalise against

    cross_correlate();
    build_nsdf();

    const int count = find_peaks();
    if (count == 0) return -1;

    // Clarity is the tallest key maximum: how periodic the frame is at all
    double clarity = -2;
    for (int i = 0; i < count; i++) {
        if (peaks[i].lag >= min_lag && peaks[i].value > clarity) clarity = peaks[i].value;
    }
    if (clarity < CLARITY_MIN) return -1;

    // First peak clearing the threshold, not the tallest: a harmonic can correlate
    // as strongly as the fundamental, so the earliest wins
    const double threshold = PEAK_FACTOR * clarity;
    int lag = -1;
    for (int i = 0; i < count; i++) {
        if (peaks[i].lag >= min_lag && peaks[i].value >= threshold) { lag = peaks[i].lag; break; }
    }
    if (lag < 0) return -1;

    const double refined = refine_lag(lag);
    if (refined <= 0) return -1;

    const double freq = rate / refined;
    if (!isfinite(freq) || freq < MIN_HZ || freq > MAX_HZ) return -1;
    return freq;
}
