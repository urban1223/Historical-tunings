(function () {
'use strict';

// withAccidentals() and the ♯/♭ artwork live in tunings.js, shared with the picker

// ---------------------------------------------------------------- which tuning
const slug = new URLSearchParams(location.search).get('t');
const tuning = TUNING_BY_SLUG[slug] || TUNINGS[0];

const baseCents = tuning.cents.slice();
const noteNames = NOTE_NAMES.slice();
const enharmonicConfig = (tuning.enharmonic || []).map(g => ({
    idx: g.idx, options: g.options.map(o => ({ ...o }))
}));

const els = {
    name: document.getElementById('tuning-name'),
    blurb: document.getElementById('tuning-note'),
    gauge: document.getElementById('gauge'),
    note: document.getElementById('note'),
    cents: document.getElementById('cents'),
    micBtn: document.getElementById('mic-btn'),
    micLabel: document.getElementById('mic-label'),
    aRef: document.getElementById('a-ref'),
    waveType: document.getElementById('wave-type'),
    enharmonics: document.getElementById('enharmonics'),
    kb: document.getElementById('kb'),
    kbScroll: document.getElementById('kb-scroll'),
    infoBtn: document.getElementById('info-btn'),
    sheet: document.getElementById('sheet'),
    sheetTitle: document.getElementById('sheet-title'),
    sheetBody: document.getElementById('sheet-body'),
    sheetClose: document.getElementById('sheet-close')
};

document.title = tuning.name + ' — Historical Tunings';
els.name.innerHTML = withAccidentals(tuning.name);
els.blurb.textContent = tuning.note;

// ---------------------------------------------------------------- pitch model
const REF_OCTAVE = 4;          // the octave in which A equals the reference
const LOW_OCTAVE = 2, HIGH_OCTAVE = 6;

function refA() {
    return Math.min(560, Math.max(350, parseFloat(els.aRef.value) || 415));
}
function freqOf(pc, octave) {
    return refA() * Math.pow(2, (baseCents[pc] - baseCents[9]) / 1200 + (octave - REF_OCTAVE));
}

// ---------------------------------------------------------------- gauge
const SPAN_CENTS = 50, SPAN_DEG = 55;
const CX = 150, CY = 134;
const R_ARC = 128, R_MINOR = 117, R_MAJOR = 108, R_LABEL = 96;

function polar(radius, deg) {
    const a = deg * Math.PI / 180;
    return [CX + radius * Math.sin(a), CY - radius * Math.cos(a)];
}
function arcPath(radius, fromDeg, toDeg) {
    const [x1, y1] = polar(radius, fromDeg);
    const [x2, y2] = polar(radius, toDeg);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function buildGauge() {
    let svg = `<path class="arc" d="${arcPath(R_ARC, -SPAN_DEG, SPAN_DEG)}"/>`;
    svg += `<path class="arc-centre" d="${arcPath(R_ARC, -5.5, 5.5)}"/>`;

    for (let c = -SPAN_CENTS; c <= SPAN_CENTS; c += 5) {
        const deg = c / SPAN_CENTS * SPAN_DEG;
        const major = (c % 25 === 0);
        const [x1, y1] = polar(R_ARC, deg);
        const [x2, y2] = polar(major ? R_MAJOR : R_MINOR, deg);
        const cls = c === 0 ? 'tick zero' : (major ? 'tick major' : 'tick');
        svg += `<line class="${cls}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
        // No label at zero: the needle rests there and the green tick marks it
        if (major && c !== 0) {
            const [lx, ly] = polar(R_LABEL, deg);
            svg += `<text class="tick-label" x="${lx.toFixed(2)}" y="${(ly + 3).toFixed(2)}">${c > 0 ? '+' + c : c}</text>`;
        }
    }

    svg += `<g id="needle-group"><path id="needle" d="M147 136 L150 16 L153 136 Z"/></g>`;
    svg += `<circle class="pivot" cx="${CX}" cy="${CY}" r="5"/>`;
    svg += `<circle class="pivot-ring" cx="${CX}" cy="${CY}" r="10"/>`;
    els.gauge.innerHTML = svg;
}

// ---------------------------------------------------------------- note readout
function renderNote(name) {
    if (!name) {
        els.note.innerHTML = '<span class="note-idle"></span>';
        return;
    }
    els.note.innerHTML = '<span class="note-letter">' + name[0] + '</span>' +
                         withAccidentals(name.slice(1));
}

// ---------------------------------------------------------------- enharmonics
function renderEnharmonics() {
    if (!enharmonicConfig.length) { els.enharmonics.style.display = 'none'; return; }
    els.enharmonics.innerHTML = '';
    enharmonicConfig.forEach(group => {
        const pair = document.createElement('div');
        pair.className = 'enh-pair';
        group.options.forEach((opt, oi) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'enh-btn' + (oi === 0 ? ' active' : '');
            b.innerHTML = withAccidentals(opt.label, 'accidental');
            b.addEventListener('click', () => {
                noteNames[group.idx] = opt.label;
                baseCents[group.idx] = opt.cents;
                pair.querySelectorAll('.enh-btn').forEach((x, i) => x.classList.toggle('active', i === oi));
                renderKeyboard();
                retuneDrones();
            });
            pair.appendChild(b);
        });
        els.enharmonics.appendChild(pair);
    });
}

// ---------------------------------------------------------------- keyboard
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
const BLACK_AFTER = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };   // white index -> black pc
const WK_W = 46, BK_W = 30;

const drones = {};      // "pc:oct" -> { osc, gain, pc, octave }
const VOICE_GAIN = 0.13;    // per held key; six voices peak around 0.6
let audioCtx = null, droneBus = null;
let waveNow = null;         // waveform the running voices were built with

function renderKeyboard() {
    const octaves = HIGH_OCTAVE - LOW_OCTAVE + 1;
    els.kb.style.width = (octaves * WHITE_PC.length * WK_W) + 'px';
    els.kb.innerHTML = '';

    for (let o = 0; o < octaves; o++) {
        const octave = LOW_OCTAVE + o;
        WHITE_PC.forEach((pc, wi) => {
            const x = (o * WHITE_PC.length + wi) * WK_W;
            els.kb.appendChild(makeKey(pc, octave, x, WK_W, 'wkey'));
            const blackPc = BLACK_AFTER[wi];
            if (blackPc !== undefined) {
                els.kb.appendChild(makeKey(blackPc, octave, x + WK_W - BK_W / 2, BK_W, 'bkey'));
            }
        });
    }
}

function makeKey(pc, octave, x, w, cls) {
    const id = pc + ':' + octave;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls + (drones[id] ? ' playing' : '');
    b.style.left = x + 'px';
    b.style.width = w + 'px';
    b.dataset.id = id;
    b.innerHTML = '<span class="key-label">' + withAccidentals(noteNames[pc], 'kb-acc') +
                  (cls === 'wkey' && pc === 0 ? '<span class="key-oct">' + octave + '</span>' : '') +
                  '</span>';
    b.addEventListener('click', () => toggleDrone(pc, octave));
    return b;
}

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        waveNow = els.waveType.value;
        // Every voice sums here, giving setDroneWave one handle to duck
        droneBus = audioCtx.createGain();
        droneBus.gain.value = 1;
        droneBus.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function toggleDrone(pc, octave) {
    const ctx = ensureAudio();
    const id = pc + ':' + octave;
    const key = els.kb.querySelector('[data-id="' + id + '"]');

    if (drones[id]) {
        const d = drones[id];
        d.gain.gain.cancelScheduledValues(ctx.currentTime);
        d.gain.gain.setValueAtTime(d.gain.gain.value, ctx.currentTime);
        d.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        d.osc.stop(ctx.currentTime + 0.12);
        d.osc.onended = () => { d.osc.disconnect(); d.gain.disconnect(); };
        delete drones[id];
        if (key) key.classList.remove('playing');
        return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = els.waveType.value;
    osc.frequency.setValueAtTime(freqOf(pc, octave), ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(VOICE_GAIN, ctx.currentTime + 0.06);
    osc.connect(gain); gain.connect(droneBus);
    osc.start();
    drones[id] = { osc, gain, pc, octave };
    if (key) key.classList.add('playing');
}

function retuneDrones() {
    if (!audioCtx) return;
    Object.values(drones).forEach(d => {
        d.osc.frequency.setTargetAtTime(freqOf(d.pc, d.octave), audioCtx.currentTime, 0.03);
    });
}

// Ducks the bus around the switch: assigning osc.type jumps the waveform
// mid-cycle, which clicks on every held voice at once.
function setDroneWave() {
    if (!audioCtx) return;
    const wave = els.waveType.value;
    if (wave === waveNow) return;
    waveNow = wave;

    const t = audioCtx.currentTime;
    droneBus.gain.cancelScheduledValues(t);
    droneBus.gain.setValueAtTime(droneBus.gain.value, t);
    droneBus.gain.linearRampToValueAtTime(0.0001, t + 0.02);

    setTimeout(() => {
        Object.values(drones).forEach(d => { d.osc.type = wave; });
        const t2 = audioCtx.currentTime;
        droneBus.gain.setValueAtTime(0.0001, t2);
        droneBus.gain.linearRampToValueAtTime(1, t2 + 0.03);
    }, 25);
}

// ---------------------------------------------------------------- mic
let analyser = null, micStream = null, lowPass = null, highPass = null;
let micStarting = false;   // getUserMedia is awaited, so two fast taps would open two streams
let resumeOnShow = false;  // set only when the tab took the mic away, never by the button

// Releases the device, so the browser's recording indicator goes out with it
function stopMic() {
    analyser = null;
    clearInterval(detectTimer); detectTimer = 0;
    if (lowPass) { lowPass.disconnect(); lowPass = null; }
    if (highPass) { highPass.disconnect(); highPass = null; }
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    els.micBtn.classList.remove('live');
    els.micLabel.textContent = 'Turn on microphone';
    resetReadout();
}

// Silent when the tab is restoring listening by itself: nothing was tapped, so a
// dialog would arrive unprompted and the button going dark says enough
async function startMic(silent) {
    if (!window.isSecureContext) {
        if (!silent) alert('Microphone access needs a secure connection (HTTPS).');
        return;
    }
    micStarting = true;
    // Asking for the microphone before the detector can use it would light the
    // recording indicator over an app that cannot listen
    if (!await TunerCore.whenReady()) {
        micStarting = false;
        if (!silent) alert('The pitch detector could not load. Reload the page and try again.');
        return;
    }
    const ctx = ensureAudio();
    try {
        // iOS suspends the context in the background and the analyser reads silence until it wakes
        if (ctx.state === 'suspended') await ctx.resume();
        micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false
            }
        });
        const source = ctx.createMediaStreamSource(micStream);

        highPass = ctx.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.setValueAtTime(35, ctx.currentTime);

        lowPass = ctx.createBiquadFilter();
        lowPass.type = 'lowpass';
        // Higher than this and a phone's presence boost costs more than the extra partials gain
        lowPass.frequency.setValueAtTime(5000, ctx.currentTime);

        analyser = ctx.createAnalyser();
        analyser.fftSize = 8192;
        if (!TunerCore.init(analyser.fftSize, ctx.sampleRate)) {
            throw new Error('the detector could not start at ' + ctx.sampleRate + 'Hz');
        }

        source.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(analyser);

        els.micBtn.classList.add('live');
        lastDetect = 0;
        detectTimer = setInterval(detect, DETECT_MS);
        els.micLabel.textContent = 'Listening';
        requestAnimationFrame(loop);
    } catch (e) {
        const msg = {
            NotAllowedError: 'Microphone access was denied. Allow it in your browser’s site settings and try again.',
            PermissionDeniedError: 'Microphone access was denied. Allow it in your browser’s site settings and try again.',
            NotFoundError: 'No microphone was found on this device.',
            DevicesNotFoundError: 'No microphone was found on this device.',
            NotReadableError: 'The microphone is already in use by another app or tab.',
            TrackStartError: 'The microphone is already in use by another app or tab.'
        }[e.name];
        if (!silent) alert(msg || ('Microphone not available: ' + e.message));
    } finally {
        micStarting = false;
    }
    // The tab can leave while the permission prompt is still open
    if (analyser && document.hidden) { resumeOnShow = true; stopMic(); }
}

function toggleMic() {
    if (micStarting) return;
    if (analyser) { resumeOnShow = false; stopMic(); return; }
    startMic(false);
}

// ---------------------------------------------------------------- render loop
// Measured in milliseconds, not frames: rAF runs at 120Hz on recent iPhones and
// at 30 in low power mode, and a frame count would mean a different window on each
// 30 Hz. The analysis window is 171ms, so faster than this mostly re-reads the same audio
const DETECT_MS = 30;
const STABLE_MS = 200;
// A count alone starves at a low frame rate, so the window must also have spanned
// real time before anything is shown
const MIN_READINGS = 3;
const MIN_SPAN_MS = 120;
// A semitone. Past that the note name itself is ambiguous, so a reading that moves
// this far inside the window is speech or a note change, not a note being held
const STABLE_CENTS = 100;
const freqHistory = [];         // { f, t }, trimmed to STABLE_MS on every push
let needleAngle = 0, targetCents = 0;
let displayedName = null, candidateName = null, agreeCount = 0;
let quietMs = 0, idle = true;
let lastFrame = performance.now();
let lastDetect = 0, detectTimer = 0;

function resetReadout() {
    freqHistory.length = 0;
    targetCents = 0;
    displayedName = candidateName = null; agreeCount = 0;
    idle = true;
    renderNote(null);
    els.cents.textContent = '—';
    els.cents.classList.remove('in-tune');
}

// Filters frequency rather than cents: cents are relative to whichever note is
// nearest, so a note change would put two different references in the window.
// Speech is periodic enough to clear the clarity gate, so steadiness is what
// separates it from a string: null until the window is both full and settled.
function steadyFreq(f, now) {
    freqHistory.push({ f: f, t: now });
    while (freqHistory.length && now - freqHistory[0].t > STABLE_MS) freqHistory.shift();
    if (freqHistory.length < MIN_READINGS) return null;
    if (now - freqHistory[0].t < MIN_SPAN_MS) return null;
    const sorted = freqHistory.map(e => e.f).sort((a, b) => a - b);
    if (1200 * Math.log2(sorted[sorted.length - 1] / sorted[0]) >= STABLE_CENTS) return null;
    return sorted[Math.floor(sorted.length / 2)];
}

// Which octave the note falls in doesn't matter to the readout, so the pitch is
// folded into one octave and matched against the table there.
function nearestNote(freq) {
    const above = 1200 * Math.log2(freq / refA()) + baseCents[9];
    let best = null;
    for (let pc = 0; pc < 12; pc++) {
        let cents = (above - baseCents[pc]) % 1200;
        if (cents > 600) cents -= 1200;
        else if (cents < -600) cents += 1200;
        if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { pc, cents };
    }
    return best;
}

// Driven by its own timer, not by the display: the analyser always holds the most
// recent window, so the rate the audio is read at should not depend on the refresh
// rate of the screen in front of it.
function detect() {
    if (!analyser) return;

    const now = performance.now();
    const sinceDetect = lastDetect ? Math.min(1000, now - lastDetect) : DETECT_MS;
    lastDetect = now;

    // The analyser writes its frame into the core's own memory, so the audio goes
    // from the graph to the detector without being copied
    analyser.getFloatTimeDomainData(TunerCore.input());
    const pitch = TunerCore.detect();

    const freq = pitch !== null ? steadyFreq(pitch, now) : null;

    // An unsteady reading is treated exactly like no reading, so talking near the
    // tuner leaves the last settled note up and then times out rather than dancing
    if (freq !== null) {
        quietMs = 0;

        const near = nearestNote(freq);

        // The letter switches only after the same note wins a few frames, so a
        // pitch sitting on a boundary doesn't flicker.
        const name = noteNames[near.pc];
        if (name === candidateName) agreeCount++;
        else { candidateName = name; agreeCount = 1; }

        // A cents figure means nothing without the letter it is measured from, so
        // the number and the needle wait for the same agreement the letter does
        if (agreeCount >= 3) {
            idle = false;
            if (name !== displayedName) {
                displayedName = name;
                renderNote(name);
            }

            // The measured deviation; the needle lags it by design
            targetCents = near.cents;
            const shown = Math.max(-99.9, Math.min(99.9, targetCents));
            els.cents.textContent = (shown > 0 ? '+' : '') + shown.toFixed(1) + '¢';
            els.cents.classList.toggle('in-tune', Math.abs(targetCents) <= 2);
        }
    } else {
        // Emptied only when the detector found nothing periodic at all; an unsteady
        // note keeps filling it so a reading can settle without a fresh twelve frames
        if (pitch === null) freqHistory.length = 0;
        quietMs += sinceDetect;
        if (quietMs > 4000) {
            targetCents = 0;
            if (!idle) resetReadout();
        }
    }
}

// The needle keeps its own clock so it stays smooth at whatever the display runs at
function loop() {
    if (!analyser) return;
    const now = performance.now();
    const dt = Math.min(2, (now - lastFrame) / 16.666);
    lastFrame = now;
    animate(dt);
}

// Needle physics: chase fast when far, settle slowly when close
function animate(dt) {
    const diff = Math.abs(targetCents - needleAngle);
    const speed = diff > 15 ? 0.30 : 0.12;
    needleAngle += (targetCents - needleAngle) * speed * dt;
    if (Math.abs(needleAngle) < 0.03) needleAngle = 0;

    const clamped = Math.max(-SPAN_CENTS, Math.min(SPAN_CENTS, needleAngle));
    const deg = clamped / SPAN_CENTS * SPAN_DEG;
    if (needleGroup) needleGroup.setAttribute('transform', `rotate(${deg.toFixed(2)} ${CX} ${CY})`);
    if (needlePath) needlePath.classList.toggle('in-tune', !idle && Math.abs(targetCents) <= 2);

    requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- info sheet
// Every figure below is read off the temperament's own table, so the panel
// cannot drift from what the tuner is playing.
const PURE_THIRD = centsOf(5 / 4);
const CHAIN_POS = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];   // E♭ up to G♯

// The panel prints one decimal, so whatever rounds to zero is reported as zero.
// Tying the test to the display stops it printing +0.0¢ and withholding "pure".
const isZero = v => Math.round(v * 10) === 0;

// Naming the comma claims the temperament was built that way, so it needs a far
// tighter fit: at one decimal an accidental 5.391 and a real 5.377 both read 5.4.
const EXACT = 0.005;

// Named amounts a fifth may be tempered by, so the table can say how the
// temperament was built and not only by how much.
const COMMA_NAMES = [
    [SYNTONIC_COMMA / 4,    '¼ synt. comma'],
    [SYNTONIC_COMMA / 6,    '⅙ synt. comma'],
    [PYTHAGOREAN_COMMA / 4, '¼ Pyth. comma'],
    [PYTHAGOREAN_COMMA / 6, '⅙ Pyth. comma'],
    [SCHISMA,               'schisma'],
    [SYNTONIC_COMMA,        'synt. comma'],
    [PYTHAGOREAN_COMMA,     'Pyth. comma']
];

// The octave a harpsichord tuner lays the bearings in, holding every beat rate
// in the range where they are slow enough to count
const bearingOctave = pc => (pc >= 5 ? 3 : 4);

// Deliberately not freqOf(): that follows the enharmonic buttons, and the chain
// is only a chain in the spelling E♭…G♯.
function tableFreq(pc, octave) {
    return refA() * Math.pow(2, (tuning.cents[pc] - tuning.cents[9]) / 1200 + (octave - REF_OCTAVE));
}

function fifthRows() {
    return CHAIN_POS.map((pos, i) => {
        const loPc = pitchClass(pos);
        const hiPc = pitchClass(i === 11 ? -3 : CHAIN_POS[i + 1]);
        let span = tuning.cents[hiPc] - tuning.cents[loPc];
        while (span < 550) span += 1200;
        while (span > 850) span -= 1200;
        const lo = tableFreq(loPc, bearingOctave(loPc));
        const hi = lo * Math.pow(2, span / 1200);
        return {
            name: NOTE_NAMES[loPc] + '–' + NOTE_NAMES[hiPc],
            off: span - PURE_FIFTH,
            beats: Math.abs(3 * lo - 2 * hi),
            closing: i === 11
        };
    });
}

function thirdRows() {
    return CHAIN_POS.map(pos => {
        const rootPc = pitchClass(pos), topPc = (rootPc + 4) % 12;
        let span = tuning.cents[topPc] - tuning.cents[rootPc];
        if (span < 0) span += 1200;
        return { name: NOTE_NAMES[rootPc] + '–' + NOTE_NAMES[topPc], off: span - PURE_THIRD };
    });
}

function describeFifth(off) {
    if (isZero(off)) return 'pure';
    const dir = off < 0 ? 'narrow' : 'wide';
    const named = COMMA_NAMES.find(c => Math.abs(Math.abs(off) - c[0]) < EXACT);
    return named ? named[1] + ' ' + dir : dir;
}

const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);

function sheetTable(head, rows) {
    return '<div class="sheet-table">' +
        '<div class="sheet-row head">' + head.map(h => '<span>' + h + '</span>').join('') + '</div>' +
        rows.join('') + '</div>';
}

function renderSheet() {
    const acc = s => withAccidentals(s, 'sheet-acc');
    let h = tuning.about.map(p => '<p class="sheet-p">' + acc(p) + '</p>').join('');

    h += '<h3 class="sheet-h">The chain of fifths</h3>';
    h += sheetTable(['Fifth', 'Off pure', 'Tempered by', 'Beats'], fifthRows().map(r =>
        '<div class="sheet-row' + (r.closing ? ' closing' : '') + '">' +
        '<span>' + acc(r.name) + '</span>' +
        '<span class="num">' + (isZero(r.off) ? '—' : signed(r.off) + '¢') + '</span>' +
        '<span class="tag">' + describeFifth(r.off) + '</span>' +
        '<span class="num">' + (r.beats < 0.05 ? '—' : r.beats.toFixed(1)) + '</span></div>'));
    h += '<p class="sheet-note">The last row closes the circle and is whatever the other eleven leave behind. ' +
         'Beats are per second, for the lower note taken in the octave F3–E4, at the reference A set ' +
         'below; a pure fifth does not beat. Taken as a fourth instead, an octave higher, the same ' +
         'fifth beats exactly twice as fast.</p>';

    h += '<h3 class="sheet-h">Major thirds</h3>';
    h += sheetTable(['Third', 'Off pure', '', ''], thirdRows().map(r =>
        '<div class="sheet-row"><span>' + acc(r.name) + '</span>' +
        '<span class="num">' + (isZero(r.off) ? '—' : signed(r.off) + '¢') + '</span>' +
        '<span class="tag">' + (isZero(r.off) ? 'pure' : '') + '</span>' +
        '<span></span></div>'));
    h += '<p class="sheet-note">Roots run in chain order, from the flat end of the chain to the sharp end. ' +
         'A pure major third is 386.31¢.</p>';

    if (tuning.source) h += '<p class="sheet-src">' + tuning.source + '</p>';
    els.sheetBody.innerHTML = h;
}

// The page is pinned while the sheet is up: a flick past the end of the panel
// would otherwise scroll the tuner underneath it
function openSheet() {
    renderSheet();
    els.sheet.hidden = false;
    document.documentElement.classList.add('sheet-open');
    els.sheetClose.focus();
}
function closeSheet() {
    els.sheet.hidden = true;
    document.documentElement.classList.remove('sheet-open');
    els.infoBtn.focus();
}

// ---------------------------------------------------------------- wiring
els.micBtn.addEventListener('click', toggleMic);
// A hidden tab throttles the detector to about 1Hz, too slow for a reading to ever
// settle, so the device is handed back on the way out and taken again on the way in
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (analyser) { resumeOnShow = true; stopMic(); }
    } else if (resumeOnShow) {
        resumeOnShow = false;
        startMic(true);
    }
});
els.aRef.addEventListener('input', retuneDrones);
// A temperament with nothing sourced to say gets no button at all
if (tuning.about) els.infoBtn.addEventListener('click', openSheet);
else els.infoBtn.hidden = true;
els.sheetClose.addEventListener('click', closeSheet);
els.sheet.addEventListener('click', e => { if (e.target === els.sheet) closeSheet(); });

// The tuner stays in the tab order behind the backdrop, so Tab is confined to
// the sheet's own two stops rather than walking into controls nobody can see
document.addEventListener('keydown', e => {
    if (els.sheet.hidden) return;
    if (e.key === 'Escape') return closeSheet();
    if (e.key !== 'Tab') return;
    const stops = [els.sheetClose, els.sheetBody];
    const at = stops.indexOf(document.activeElement);
    e.preventDefault();
    stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
});
els.waveType.addEventListener('change', setDroneWave);

els.sheetTitle.innerHTML = withAccidentals(tuning.name);
buildGauge();
const needleGroup = document.getElementById('needle-group');
const needlePath = document.getElementById('needle');

renderNote(null);
renderEnharmonics();
renderKeyboard();

// Open centred on the reference octave rather than at the bass end
requestAnimationFrame(() => {
    const perOctave = WHITE_PC.length * WK_W;
    els.kbScroll.scrollLeft = (REF_OCTAVE - LOW_OCTAVE) * perOctave - perOctave * 0.25;
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

})();
