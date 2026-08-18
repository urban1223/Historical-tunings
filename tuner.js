(function () {
'use strict';

// withAccidentals() and the ♯/♭ artwork live in tunings.js, shared with the picker

// ---------------------------------------------------------------- which tuning
const slug = new URLSearchParams(location.search).get('t');
const tuning = TUNING_BY_SLUG[slug] || TUNINGS[0];

const baseCents = tuning.cents.slice();
const noteNames = tuning.noteNames.slice();
const enharmonicConfig = (tuning.enharmonic || []).map(g => ({
    idx: g.idx, options: g.options.map(o => ({ ...o }))
}));

const els = {
    name: document.getElementById('tuning-name'),
    blurb: document.getElementById('tuning-note'),
    gauge: document.getElementById('gauge'),
    note: document.getElementById('note'),
    cents: document.getElementById('cents'),
    hz: document.getElementById('hz'),
    micBtn: document.getElementById('mic-btn'),
    micLabel: document.getElementById('mic-label'),
    aRef: document.getElementById('a-ref'),
    waveType: document.getElementById('wave-type'),
    enharmonics: document.getElementById('enharmonics'),
    kb: document.getElementById('kb'),
    kbScroll: document.getElementById('kb-scroll')
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
        // No label at zero — the needle rests over that spot, and the green
        // tick already marks it
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
let audioCtx = null;

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
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
        delete drones[id];
        if (key) key.classList.remove('playing');
        return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = els.waveType.value;
    osc.frequency.setValueAtTime(freqOf(pc, octave), ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.06);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    drones[id] = { osc, gain, pc, octave };
    if (key) key.classList.add('playing');
}

function retuneDrones() {
    if (!audioCtx) return;
    const wave = els.waveType.value;
    Object.values(drones).forEach(d => {
        d.osc.type = wave;
        d.osc.frequency.setTargetAtTime(freqOf(d.pc, d.octave), audioCtx.currentTime, 0.03);
    });
}

// ---------------------------------------------------------------- detection
const MIN_HZ = 45;          // below harpsichord GG at A=415
const MAX_HZ = 2200;        // above the top of the violin/recorder register
const CLARITY_MIN = 0.5;
const PEAK_FACTOR = 0.9;

let analyser = null, micStream = null, lowPass = null, highPass = null;
let detBuf = null, nsdf = null, peakLags = null, peakVals = null;
let minLag = 0, maxLag = 0, halfWin = 0;
let noiseFloor = 0.0015;

function initDetector(fftSize, sampleRate) {
    halfWin = Math.floor(fftSize / 2);
    minLag = Math.max(2, Math.floor(sampleRate / MAX_HZ));
    maxLag = Math.min(halfWin - 1, Math.ceil(sampleRate / MIN_HZ));
    detBuf = new Float32Array(fftSize);
    nsdf = new Float32Array(maxLag + 2);
    peakLags = new Int32Array(64);
    peakVals = new Float32Array(64);
}

// MPM (McLeod Pitch Method). Each lag is normalized by its own energy, which
// keeps it accurate while a note decays across the window and yields a clarity
// value in [-1, 1] used as the confidence gate.
function detectPitch(buf, sampleRate) {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);

    // Adapt to the room from quiet frames only. A cheap early-out before the
    // expensive part; clarity below is the real decision.
    if (rms < noiseFloor * 2.5) noiseFloor += (rms - noiseFloor) * 0.02;
    if (rms < Math.max(0.004, noiseFloor * 3.5)) return null;

    let energy = 0;
    for (let t = 0; t <= maxLag; t++) {
        let r = 0, m = 0;
        for (let j = 0; j < halfWin; j++) {
            const a = buf[j], b = buf[j + t];
            r += a * b;
            m += a * a + b * b;
        }
        nsdf[t] = m > 0 ? (2 * r) / m : 0;
        energy += m;
    }
    if (energy === 0) return null;

    // Key maxima: highest point in each positively-sloped zero-crossing region.
    let count = 0, t = 0;
    // Must start at lag 0 so the lobe skipped is the trivial one at zero — from
    // minLag it could skip the real fundamental's lobe instead.
    while (t <= maxLag && nsdf[t] > 0) t++;
    while (t <= maxLag && count < peakLags.length) {
        while (t <= maxLag && nsdf[t] <= 0) t++;
        if (t > maxLag) break;
        let bestV = -2, bestT = t;
        while (t <= maxLag && nsdf[t] > 0) {
            if (nsdf[t] > bestV) { bestV = nsdf[t]; bestT = t; }
            t++;
        }
        if (bestV > -2) { peakLags[count] = bestT; peakVals[count] = bestV; count++; }
    }
    if (count === 0) return null;

    let globalMax = -2;
    for (let i = 0; i < count; i++) {
        if (peakLags[i] >= minLag && peakVals[i] > globalMax) globalMax = peakVals[i];
    }
    if (globalMax < CLARITY_MIN) return null;

    // First peak clearing the threshold, not the tallest — a harmonic can
    // correlate as strongly as the fundamental, so the earliest wins.
    const threshold = PEAK_FACTOR * globalMax;
    let lag = -1;
    for (let i = 0; i < count; i++) {
        if (peakLags[i] >= minLag && peakVals[i] >= threshold) { lag = peakLags[i]; break; }
    }
    if (lag < 0) return null;

    let refined = lag;
    if (lag > 0 && lag < maxLag) {
        const y0 = nsdf[lag - 1], y1 = nsdf[lag], y2 = nsdf[lag + 1];
        const denom = 2 * y1 - y0 - y2;
        if (denom !== 0) refined = lag + 0.5 * (y2 - y0) / denom;
    }
    if (refined <= 0) return null;

    const freq = sampleRate / refined;
    if (!isFinite(freq) || freq < MIN_HZ || freq > MAX_HZ) return null;
    return { freq };
}

// ---------------------------------------------------------------- mic
async function toggleMic() {
    if (analyser) {
        analyser = null;
        if (lowPass) { lowPass.disconnect(); lowPass = null; }
        if (highPass) { highPass.disconnect(); highPass = null; }
        if (micStream) micStream.getTracks().forEach(t => t.stop());
        els.micBtn.classList.remove('live');
        els.micLabel.textContent = 'Turn on microphone';
        resetReadout();
        return;
    }
    if (!window.isSecureContext) {
        alert('Microphone access needs a secure connection (HTTPS).');
        return;
    }
    const ctx = ensureAudio();
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = ctx.createMediaStreamSource(micStream);

        highPass = ctx.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.setValueAtTime(35, ctx.currentTime);

        lowPass = ctx.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.setValueAtTime(3500, ctx.currentTime);

        analyser = ctx.createAnalyser();
        analyser.fftSize = 8192;
        initDetector(analyser.fftSize, ctx.sampleRate);

        source.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(analyser);

        els.micBtn.classList.add('live');
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
        alert(msg || ('Microphone not available: ' + e.message));
    }
}

// ---------------------------------------------------------------- render loop
const HISTORY = 5;
const freqHistory = new Array(HISTORY).fill(null);
let histIdx = 0;
let needleAngle = 0, targetCents = 0;
let displayedName = null, candidateName = null, agreeCount = 0;
let silenceMs = 0, idle = true;
let lastFrame = performance.now();

function resetReadout() {
    freqHistory.fill(null); histIdx = 0;
    targetCents = 0;
    displayedName = candidateName = null; agreeCount = 0;
    idle = true;
    renderNote(null);
    els.cents.textContent = '—';
    els.hz.textContent = '— Hz';
    els.cents.classList.remove('in-tune');
}

// Median over frequency, not over cents. Cents are relative to whichever note is
// closest, so averaging them across a note change compares values measured
// against different references.
function medianFreq(f) {
    freqHistory[histIdx % HISTORY] = f;
    histIdx++;
    const valid = freqHistory.filter(v => v !== null).sort((a, b) => a - b);
    return valid[Math.floor(valid.length / 2)];
}

function nearestNote(freq) {
    const a = refA();
    let best = null;
    for (let pc = 0; pc < 12; pc++) {
        for (let oct = LOW_OCTAVE - 1; oct <= HIGH_OCTAVE + 1; oct++) {
            const target = a * Math.pow(2, (baseCents[pc] - baseCents[9]) / 1200 + (oct - REF_OCTAVE));
            const cents = 1200 * Math.log2(freq / target);
            if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { pc, oct, cents };
        }
    }
    return best;
}

function loop() {
    if (!analyser || !detBuf) return;

    const now = performance.now();
    const dt = Math.min(2, (now - lastFrame) / 16.666);
    lastFrame = now;

    analyser.getFloatTimeDomainData(detBuf);
    const pitch = detectPitch(detBuf, audioCtx.sampleRate);

    if (pitch) {
        silenceMs = 0;
        idle = false;

        const freq = medianFreq(pitch.freq);
        const near = nearestNote(freq);
        targetCents = near.cents;

        // Switch the letter only once the same note has won a few frames, so a
        // pitch sitting on a boundary doesn't flicker. Derived from the same
        // filtered frequency as the needle, so the two never disagree.
        const name = noteNames[near.pc];
        if (name === candidateName) agreeCount++;
        else { candidateName = name; agreeCount = 1; }
        if (agreeCount >= 3 && name !== displayedName) {
            displayedName = name;
            renderNote(name);
        }

        // The measured deviation, not the animated needle position
        const shown = Math.max(-99.9, Math.min(99.9, targetCents));
        els.cents.textContent = (shown > 0 ? '+' : '') + shown.toFixed(1) + '¢';
        els.hz.textContent = freq.toFixed(2) + ' Hz';
        els.cents.classList.toggle('in-tune', Math.abs(targetCents) <= 2);
    } else {
        freqHistory.fill(null); histIdx = 0;
        silenceMs += dt * 16.666;
        if (silenceMs > 4000) {
            targetCents = 0;
            if (!idle) resetReadout();
        }
    }

    // Needle physics: chase fast when far, settle slowly when close
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

// ---------------------------------------------------------------- wiring
els.micBtn.addEventListener('click', toggleMic);
els.aRef.addEventListener('input', retuneDrones);
els.waveType.addEventListener('change', retuneDrones);

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
