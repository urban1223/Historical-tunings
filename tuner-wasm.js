// The detection core, compiled from C. The module imports nothing and exports its
// own memory, so it instantiates with no glue and no import object.
const TunerCore = (function () {
    let ex = null;      // wasm exports, null until the fetch resolves
    let view = null;    // Float32Array over the module's own input buffer

    // Fetched as an ArrayBuffer rather than streamed, so a server that hands the
    // file over as octet-stream still works
    const ready = fetch('tuner-core.wasm')
        .then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('HTTP ' + r.status)))
        .then(bytes => WebAssembly.instantiate(bytes, {}))
        .then(res => { ex = res.instance.exports; ex._initialize(); return true; })
        .catch(e => { console.error('tuner-core.wasm did not load:', e.message); return false; });

    function init(fftSize, sampleRate) {
        if (!ex || !ex.th_init(sampleRate, fftSize)) return false;
        // Memory never grows, so this view stays valid for the whole session
        view = new Float32Array(ex.memory.buffer, ex.th_input(), fftSize);
        return true;
    }

    // The analyser fills this directly, so a frame is never copied anywhere
    function input() { return view; }

    function detect() {
        if (!view) return null;
        const f = ex.th_detect();
        return f < 0 ? null : f;
    }

    return { whenReady: () => ready, init, input, detect };
})();
