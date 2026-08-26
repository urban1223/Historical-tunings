(function () {
'use strict';

// withAccidentals(), centsOf(), NOTE_NAMES and TUNINGS live in tunings.js

// ---------------------------------------------------------------- interval names
// Names follow the Huygens-Fokker list of intervals; anything not on it is left
// unnamed. Where that list gives a plain name, "just" is prepended, since every one
// of those also exists tempered elsewhere in this app.
const INTERVAL_NAMES = {
    '16/15': 'minor diatonic semitone',
    '15/14': 'major diatonic semitone',
    '12/11': 'undecimal neutral second',
    '10/9':  'minor whole tone',
    '9/8':   'major whole tone',
    '8/7':   'septimal whole tone',
    '7/6':   'septimal minor third',
    '6/5':   'just minor third',
    '11/9':  'undecimal neutral third',
    '5/4':   'just major third',
    '9/7':   'septimal major third',
    '4/3':   'just perfect fourth',
    '11/8':  'undecimal semi-augmented fourth',
    '7/5':   'septimal or Huygens’ tritone',
    '10/7':  'Euler’s tritone',
    '3/2':   'just perfect fifth',
    '14/9':  'septimal minor sixth',
    '8/5':   'just minor sixth',
    '13/8':  'tridecimal neutral sixth',
    '5/3':   'just major sixth',
    '12/7':  'septimal major sixth',
    '7/4':   'harmonic seventh',
    '16/9':  'Pythagorean minor seventh',
    '9/5':   'just minor seventh',
    '11/6':  'undecimal neutral seventh',
    '15/8':  'classic major seventh'
};

const OCT_ALONE = ['unison', 'octave', 'two octaves', 'three octaves', 'four octaves'];
const OCT_AWAY  = ['', 'one octave', 'two octaves', 'three octaves', 'four octaves'];

// ---------------------------------------------------------------- state
const MAX_HARMONIC = 16;
const LOW_OCTAVE = 2, HIGH_OCTAVE = 7;      // an octave taller than the tuner, so the wide ratios mostly land on it

let tuning = TUNING_BY_SLUG[new URLSearchParams(location.search).get('t')] || TUNINGS[0];
let num = 5, den = 4;
// The root is 1/1 and carries the pitch, so changing what it is compared against
// moves the keys under it and never the ratio itself. It opens on the reference
// the rest of the app tunes to.
let rootPc = 9, rootOctave = 4, rootFreq = 415;
let upperVoice = 'pure';                    // 'pure' plays the ratio, 'key' plays the note it is nearest

const els = {
    figure: document.getElementById('ratio-figure'),
    name: document.getElementById('ratio-name'),
    facts: document.getElementById('ratio-facts'),
    harmNum: document.getElementById('harm-num'),
    harmDen: document.getElementById('harm-den'),
    soundBtn: document.getElementById('sound-btn'),
    voicePick: document.getElementById('voice-pick'),
    voicePureVal: document.getElementById('voice-pure-val'),
    voiceKeySys: document.getElementById('voice-key-sys'),
    voiceKeyVal: document.getElementById('voice-key-val'),
    voiceKeyOff: document.getElementById('voice-key-off'),
    rootHz: document.getElementById('root-hz'),
    waveType: document.getElementById('wave-type'),
    rootHzLabel: document.getElementById('root-hz-label'),
    tuningPick: document.getElementById('tuning-pick'),
    kb: document.getElementById('kb'),
    kbScroll: document.getElementById('kb-scroll'),
    marker: document.getElementById('marker')
};

// ---------------------------------------------------------------- arithmetic
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const reduce = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };

// Cents above C in the lowest octave drawn, so every key and the ratio itself
// can be compared on one scale
function absCents(pc, octave) {
    return tuning.cents[pc] + 1200 * (octave - LOW_OCTAVE);
}
// Every key is the tuning's own interval away from the root, so the whole ladder
// follows once the root has a frequency
function keyFreq(pc, octave) {
    return rootFreq * Math.pow(2, (tuning.cents[pc] - tuning.cents[rootPc]) / 1200 + (octave - rootOctave));
}

// The largest prime in the reduced ratio — what "5-limit" or "7-limit" counts
function primeLimit(n, d) {
    let max = 1;
    [n, d].forEach(v => {
        for (let p = 2; p <= v; p++) {
            while (v % p === 0) { if (p > max) max = p; v /= p; }
        }
    });
    return max;
}

// Octaves are stripped off first, so 7/2 is named as the 7/4 it is an octave above
function describeRatio(n, d) {
    let [a, b] = reduce(n, d);
    let oct = 0;
    while (a >= 2 * b) { b *= 2; oct++; }
    while (a < b) { a *= 2; oct--; }
    [a, b] = reduce(a, b);

    if (a === 1 && b === 1) return OCT_ALONE[Math.abs(oct)] + (oct < 0 ? ' down' : '');
    const base = INTERVAL_NAMES[a + '/' + b];
    if (!base) return '';
    if (oct === 0) return base;
    return base + ', ' + OCT_AWAY[Math.abs(oct)] + (oct > 0 ? ' up' : ' down');
}

// Works past both ends of the keyboard, so a ratio drawn off the edge can still
// say which note it is nearest
function nearestKey(abs) {
    const octave = Math.floor(abs / 1200);
    let best = null;
    for (let k = -1; k <= 1; k++) {
        for (let pc = 0; pc < 12; pc++) {
            const off = abs - (tuning.cents[pc] + 1200 * (octave + k));
            if (!best || Math.abs(off) < Math.abs(best.off)) {
                best = { pc: pc, octave: LOW_OCTAVE + octave + k, off: off };
            }
        }
    }
    return best;
}

// ---------------------------------------------------------------- keyboard
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
const BLACK_AFTER = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
const WK_W = 46, BK_W = 30;

let keyStops = [];      // { abs, x } for every key, in pitch order, for placing the marker

function buildKeyboard() {
    const octaves = HIGH_OCTAVE - LOW_OCTAVE + 1;
    els.kb.style.width = (octaves * WHITE_PC.length * WK_W) + 'px';
    els.kb.querySelectorAll('button').forEach(b => b.remove());

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
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.style.left = x + 'px';
    b.style.width = w + 'px';
    b.dataset.id = pc + ':' + octave;
    b.innerHTML = '<span class="key-label">' + withAccidentals(NOTE_NAMES[pc], 'kb-acc') +
                  (cls === 'wkey' && pc === 0 ? '<span class="key-oct">' + octave + '</span>' : '') +
                  '</span>';
    // Taken through the root it is leaving, so moving along the keyboard follows the
    // tuning's own intervals instead of dragging the old pitch onto the new note
    b.addEventListener('click', () => {
        rootFreq = keyFreq(pc, octave);
        rootPc = pc;
        rootOctave = octave;
        els.rootHz.value = rootFreq.toFixed(2);
        render();
    });
    return b;
}

// A black key sits on the boundary between two whites, which is where its centre
// falls; a white key's centre is the middle of its own width.
function measureKeys() {
    keyStops = [];
    for (let o = 0; o < HIGH_OCTAVE - LOW_OCTAVE + 1; o++) {
        const octave = LOW_OCTAVE + o;
        WHITE_PC.forEach((pc, wi) => {
            const x = (o * WHITE_PC.length + wi) * WK_W;
            keyStops.push({ abs: absCents(pc, octave), x: x + WK_W / 2 });
            const blackPc = BLACK_AFTER[wi];
            if (blackPc !== undefined) {
                keyStops.push({ abs: absCents(blackPc, octave), x: x + WK_W });
            }
        });
    }
    keyStops.sort((a, b) => a.abs - b.abs);
}

// Straight interpolation between the two keys it falls between: a ratio that lands
// nowhere near a key has to be drawn nowhere near one.
function markerX(abs) {
    if (abs < keyStops[0].abs || abs > keyStops[keyStops.length - 1].abs) return null;
    for (let i = 0; i < keyStops.length - 1; i++) {
        const lo = keyStops[i], hi = keyStops[i + 1];
        if (abs <= hi.abs) {
            const t = hi.abs === lo.abs ? 0 : (abs - lo.abs) / (hi.abs - lo.abs);
            return lo.x + t * (hi.x - lo.x);
        }
    }
    return keyStops[keyStops.length - 1].x;
}

// Only when it has gone out of sight, so a deliberate scroll is not fought. Held
// off until the opening scroll has run, which would otherwise cut it short.
let scrollReady = false;

function revealMarker(x) {
    const el = els.kbScroll;
    if (!scrollReady) return;
    if (x > el.scrollLeft + 40 && x < el.scrollLeft + el.clientWidth - 40) return;
    el.scrollTo({ left: Math.max(0, x - el.clientWidth / 2), behavior: 'smooth' });
}

// ---------------------------------------------------------------- audio
const VOICE_GAIN = 0.16;
let audioCtx = null, rootOsc = null, upperOsc = null, rootGain = null, upperGain = null;
let bus = null, waveNow = null;
let playing = false, tuned = false;

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        waveNow = els.waveType.value;
        // Both voices sum here, giving setWave one handle to duck
        bus = audioCtx.createGain();
        bus.gain.value = 1;
        bus.connect(audioCtx.destination);
        rootGain = audioCtx.createGain();
        upperGain = audioCtx.createGain();
        rootGain.gain.value = 0.0001;
        upperGain.gain.value = 0.0001;
        rootOsc = audioCtx.createOscillator();
        upperOsc = audioCtx.createOscillator();
        rootOsc.type = upperOsc.type = waveNow;
        rootOsc.connect(rootGain); rootGain.connect(bus);
        upperOsc.connect(upperGain); upperGain.connect(bus);
        rootOsc.start(); upperOsc.start();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Ducks the bus around the switch: assigning osc.type jumps the waveform mid-cycle,
// which clicks on both voices at once.
function setWave() {
    if (!audioCtx) return;
    const wave = els.waveType.value;
    if (wave === waveNow) return;
    waveNow = wave;

    const t = audioCtx.currentTime;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setValueAtTime(bus.gain.value, t);
    bus.gain.linearRampToValueAtTime(0.0001, t + 0.02);

    setTimeout(() => {
        rootOsc.type = upperOsc.type = wave;
        const t2 = audioCtx.currentTime;
        bus.gain.setValueAtTime(0.0001, t2);
        bus.gain.linearRampToValueAtTime(1, t2 + 0.03);
    }, 25);
}

// The first setting jumps rather than glides: a new oscillator sits at 440Hz, and
// sliding off it is audible under the opening fade.
function retune(rootFreq, upperFreq) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    if (!tuned) {
        tuned = true;
        rootOsc.frequency.setValueAtTime(rootFreq, t);
        upperOsc.frequency.setValueAtTime(upperFreq, t);
        return;
    }
    rootOsc.frequency.setTargetAtTime(rootFreq, t, 0.03);
    upperOsc.frequency.setTargetAtTime(upperFreq, t, 0.03);
}

function toggleSound() {
    ensureAudio();
    playing = !playing;
    els.soundBtn.classList.toggle('live', playing);
    els.soundBtn.textContent = playing ? 'Stop' : 'Play';
    render();

    const t = audioCtx.currentTime;
    const level = playing ? VOICE_GAIN : 0.0001;
    [rootGain, upperGain].forEach(g => {
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
        g.gain.exponentialRampToValueAtTime(level, t + 0.06);
    });
}

// ---------------------------------------------------------------- render
const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);

function render() {
    const [rn, rd] = reduce(num, den);
    const ratio = num / den;
    const cents = centsOf(ratio);

    const targetAbs = absCents(rootPc, rootOctave) + cents;
    const targetFreq = rootFreq * ratio;
    const near = nearestKey(targetAbs);
    const nearFreq = keyFreq(near.pc, near.octave);

    els.rootHzLabel.innerHTML = 'Root ' + withAccidentals(NOTE_NAMES[rootPc], 'sheet-acc') + rootOctave + ' (Hz)';

    els.figure.innerHTML = '<span class="r-num">' + rn + '</span>' +
                           '<span class="r-bar">/</span>' +
                           '<span class="r-den">' + rd + '</span>';

    // The unison has no prime in it, so it is the one ratio with no limit to name
    const limit = primeLimit(rn, rd);
    const name = describeRatio(num, den);
    els.name.innerHTML = (name ? name + ' ' : '') +
                         (limit > 1 ? '<span class="ratio-limit">' + limit + '-limit</span>' : '');

    els.facts.textContent = signed(cents) + '¢ · ' +
                            rootFreq.toFixed(1) + ' → ' + targetFreq.toFixed(1) + ' Hz';

    const exact = Math.round(near.off * 10) === 0;

    // Each voice carries the system it comes from, the note that system gives, and how
    // far that sits from the ratio. A mistuned rn/rd beats where its partials should
    // have coincided: the root's rn-th against the upper's rd-th.
    els.voicePureVal.textContent = rn + '/' + rd;
    els.voiceKeySys.textContent = tuning.name;
    els.voiceKeyVal.innerHTML = withAccidentals(NOTE_NAMES[near.pc], 'accidental') + near.octave;
    // Signed from the key, not from the ratio, so a wide temperament reads positive
    // the way the tuner's own tables report it
    els.voiceKeyOff.textContent = exact
        ? 'pure'
        : signed(-near.off) + '¢ · ' + Math.abs(rn * rootFreq - rd * nearFreq).toFixed(1) + '/s';
    els.voiceKeyOff.classList.toggle('exact', exact);

    els.kb.querySelectorAll('button').forEach(b => {
        b.classList.toggle('root', b.dataset.id === rootPc + ':' + rootOctave);
        b.classList.toggle('near', !exact && b.dataset.id === near.pc + ':' + near.octave);
    });

    const x = markerX(targetAbs);
    els.marker.hidden = x === null;
    if (x !== null) {
        els.marker.style.left = x + 'px';
        revealMarker(x);
    }

    [els.harmNum, els.harmDen].forEach((grid, i) => {
        const chosen = i === 0 ? num : den;
        grid.querySelectorAll('.harm-btn').forEach(b => {
            b.classList.toggle('active', Number(b.dataset.n) === chosen);
        });
    });

    retune(rootFreq, upperVoice === 'pure' ? targetFreq : nearFreq);
}

// ---------------------------------------------------------------- wiring
function buildHarmonics(grid, apply) {
    for (let n = 1; n <= MAX_HARMONIC; n++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'harm-btn';
        b.dataset.n = n;
        b.textContent = n;
        b.addEventListener('click', () => { apply(n); render(); });
        grid.appendChild(b);
    }
}

buildHarmonics(els.harmNum, n => { num = n; });
buildHarmonics(els.harmDen, n => { den = n; });

TUNINGS.forEach(t => {
    const o = document.createElement('option');
    o.value = t.slug;
    o.textContent = t.name;
    o.selected = t === tuning;
    els.tuningPick.appendChild(o);
});

els.tuningPick.addEventListener('change', () => {
    tuning = TUNING_BY_SLUG[els.tuningPick.value];
    measureKeys();
    render();
});
// Not written back while it is being typed in, so the caret is left alone
els.rootHz.addEventListener('input', () => {
    rootFreq = Math.min(4000, Math.max(20, parseFloat(els.rootHz.value) || rootFreq));
    render();
});
els.soundBtn.addEventListener('click', toggleSound);
els.waveType.addEventListener('change', setWave);
els.voicePick.addEventListener('click', e => {
    const b = e.target.closest('.enh-btn');
    if (!b) return;
    upperVoice = b.dataset.voice;
    els.voicePick.querySelectorAll('.enh-btn').forEach(x => x.classList.toggle('active', x === b));
    render();
});

buildKeyboard();
measureKeys();
render();

// Open on the root rather than at the bass end
requestAnimationFrame(() => {
    const rootX = markerX(absCents(rootPc, rootOctave));
    els.kbScroll.scrollLeft = Math.max(0, rootX - els.kbScroll.clientWidth * 0.35);
    scrollReady = true;
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

})();
