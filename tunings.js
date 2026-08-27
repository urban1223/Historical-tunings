// ♯ and ♭ as artwork rather than font glyphs, so they render identically on
// every device. They inherit currentColor, and carry the word a reader announces.
const ACCIDENTAL_SVG = {
    '♯': '<svg class="{cls}" viewBox="0 0 64 100" fill="currentColor" role="img" aria-label="sharp"><path d="M4 43 L60 30 L60 47 L4 60 Z"/><path d="M4 69 L60 56 L60 73 L4 86 Z"/><rect x="18" y="6" width="5.5" height="88"/><rect x="41" y="1" width="5.5" height="88"/></svg>',
    '♭': '<svg class="{cls}" viewBox="0 0 48 100" fill="currentColor" role="img" aria-label="flat"><rect x="11" y="1" width="5.5" height="94"/><path d="M16.5 50 C 31 39, 46 49, 42.5 68 C 39 86, 25 92, 16.5 97 Z"/></svg>'
};

// Turns a note name like "C♯" into markup with the accidental as inline SVG
function withAccidentals(name, cls) {
    return name.replace(/[♯♭]/g, m => ACCIDENTAL_SVG[m].replace('{cls}', cls || 'accidental'));
}

// ---------------------------------------------------------------- construction
const centsOf = ratio => 1200 * Math.log2(ratio);

const PURE_FIFTH        = centsOf(3 / 2);           // 701.955
const SYNTONIC_COMMA    = centsOf(81 / 80);         // 21.506 — four pure fifths overshoot a pure third by this
const PYTHAGOREAN_COMMA = centsOf(531441 / 524288); // 23.460 — twelve pure fifths overshoot seven octaves by this
const SCHISMA           = centsOf(32805 / 32768);   // 1.954 — by this much the Pythagorean comma exceeds the syntonic

// Every temperament here is a chain of fifths spelled E♭ up to G♯, so a note is
// addressed by how many fifths it sits from C: F is -1, G is +1, G♯ is +8.
const CHAIN_NAMES = ['G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];
const nameAt = pos => CHAIN_NAMES[pos + 6];
const pitchClass = pos => ((pos * 7) % 12 + 12) % 12;

// Cents above C of the note `pos` fifths away, each fifth narrowed by
// `narrow(p)` where p is the position of its lower note, folded into one octave.
function stack(pos, narrow) {
    let v = 0;
    for (let p = 0; p < pos; p++) v += PURE_FIFTH - narrow(p);
    for (let p = -1; p >= pos; p--) v -= PURE_FIFTH - narrow(p);
    return ((v % 1200) + 1200) % 1200;
}

// The twelve notes E♭…G♯, indexed by pitch class. The wolf fifth G♯-E♭ needs no
// definition: it is simply whatever gap the other eleven leave behind.
function fromFifths(narrow) {
    const out = new Array(12);
    for (let pos = -3; pos <= 8; pos++) out[pitchClass(pos)] = stack(pos, narrow);
    return out;
}

// The eleven fifths of the chain, flat end first, so a temperament can be
// written the way its source states it — by naming which fifths are tempered.
const LINKS = ['E♭-B♭', 'B♭-F', 'F-C', 'C-G', 'G-D', 'D-A', 'A-E', 'E-B', 'B-F♯', 'F♯-C♯', 'C♯-G♯'];

// Both guards turn a silent wrong temperament into a loud one: a misspelt name,
// or a fifth off the end of the chain, would otherwise just pass as pure.
function byLink(amounts) {
    Object.keys(amounts).forEach(name => {
        if (LINKS.indexOf(name) < 0) throw new Error('unknown fifth: ' + name);
    });
    return pos => {
        const name = LINKS[pos + 3];
        if (!name) throw new Error('fifth outside the chain at ' + pos);
        return amounts[name] || 0;
    };
}

const everyFifth = amount => () => amount;

// A black key carries two spellings twelve fifths apart — C♯ at +7 is D♭ at -5.
// In a meantone the gap is wide enough that the player has to choose.
const BLACK_KEYS = [7, -3, 6, 8, -2];

function enharmonicsOf(narrow) {
    return BLACK_KEYS.map(pos => {
        const alt = pos > 0 ? pos - 12 : pos + 12;
        return {
            idx: pitchClass(pos),
            options: [pos, alt].map(p => ({ label: nameAt(p), cents: stack(p, narrow) }))
        };
    });
}

// Shared by every temperament: the chain E♭…G♯ read off in pitch-class order.
const NOTE_NAMES = new Array(12);
for (let pos = -3; pos <= 8; pos++) NOTE_NAMES[pitchClass(pos)] = nameAt(pos);

// ---------------------------------------------------------------- temperaments
const QUARTER           = SYNTONIC_COMMA / 4;
const QUARTER_COMMA     = everyFifth(QUARTER);
const TWO_SEVENTH_COMMA = everyFifth(2 * SYNTONIC_COMMA / 7);
const SIXTH_COMMA       = everyFifth(SYNTONIC_COMMA / 6);

// Twelve of these close seven octaves exactly, which is the whole of equal temperament
const EQUAL_COMMA = everyFifth(PYTHAGOREAN_COMMA / 12);

// Violin open strings are pure fifths, so the two share one frozen table
const PURE_CHAIN = Object.freeze(fromFifths(everyFifth(0)));

const TUNINGS = [
    {
        slug: 'pythagorean', name: 'Pythagorean', group: 'Ancient',
        note: 'Pure fifths throughout, at the cost of very wide thirds.',
        about: [
            'Eleven pure fifths stacked in a chain from E♭ up to G♯. Nothing is tempered, so the twelfth fifth is left holding the whole Pythagorean comma — the 23.5¢ wolf between G♯ and E♭.',
            'The price of pure fifths is paid by the thirds: every usable major third is a syntonic comma wide. The four that measure almost pure (C♯–F, F♯–B♭, G♯–C, B–E♭) are diminished fourths, spelt wrong for the key they would serve.'
        ],
        source: '12-tone Pythagorean scale — pyth_12.scl, Scala archive',
        cents: PURE_CHAIN
    },
    {
        slug: 'violin', name: 'Violin Family', group: 'Ancient',
        note: 'Open strings tuned in pure fifths — Pythagorean in practice.',
        about: [
            'The open strings of the violin family are tuned in pure fifths — G–D–A–E on the violin, C–G–D–A on the viola and cello — so the table is the Pythagorean chain.',
            'Only the open strings are fixed. Everything stopped by the fingers is placed by ear against what the rest of the ensemble is doing, so the table tells you where to set the strings, not where to put your hand.'
        ],
        source: 'Pure fifths; the table is the 12-tone Pythagorean scale — pyth_12.scl, Scala archive',
        cents: PURE_CHAIN
    },
    {
        slug: 'meantone27', name: 'Meantone 2/7', group: 'Meantone',
        note: 'Fifths narrowed hard, leaving major and minor thirds equally off.',
        about: [
            'Every fifth gives up two sevenths of the syntonic comma — more than quarter-comma takes, and enough that no fifth and no third comes out pure. What it buys is symmetry: major thirds land 3.1¢ narrow and minor thirds 3.1¢ narrow as well, a seventh of the comma each, so both are wrong by exactly the same amount. The one interval it does leave pure is the chromatic semitone, C–C♯ and its four kin, at exactly 25/24.',
            'Eleven fifths tempered that hard leave a great deal for the twelfth. G♯–E♭ comes out 44.1¢ wide, the largest wolf of anything here, and the four thirds that cross it go with it.'
        ],
        source: '2/7-comma meantone, Zarlino’s temperament (1558) — mean2sev.scl, Scala archive',
        cents: fromFifths(TWO_SEVENTH_COMMA),
        enharmonic: enharmonicsOf(TWO_SEVENTH_COMMA)
    },
    {
        slug: 'meantone4', name: 'Meantone 1/4', group: 'Meantone',
        note: 'Fifths narrowed by a quarter comma, giving pure major thirds.',
        about: [
            'Every fifth is narrowed by a quarter of the syntonic comma — the exact amount that lands four stacked fifths on a pure major third. Eight of the twelve thirds come out pure.',
            'The chain still has to close somewhere. G♯–E♭ is left 35.7¢ wide, the classic wolf, and the four thirds that cross it are unusable.'
        ],
        source: '1/4-comma meantone, Pietro Aaron (1523) — meanquar.scl, Scala archive',
        cents: fromFifths(QUARTER_COMMA),
        enharmonic: enharmonicsOf(QUARTER_COMMA)
    },
    {
        slug: 'meantone6', name: 'Meantone 1/6', group: 'Meantone',
        note: 'A milder meantone; thirds slightly wide, fifths less narrow.',
        about: [
            'The same construction as quarter-comma, but each fifth gives up only a sixth of the syntonic comma. Thirds come out 7.2¢ wide instead of pure, and the fifths sit much closer to pure.',
            'In exchange the wolf shrinks from 35.7¢ to 16¢, which brings the remote keys back within reach.'
        ],
        source: '1/6-comma meantone, tritonic temperament of Salinas — meansixth.scl, Scala archive',
        cents: fromFifths(SIXTH_COMMA),
        enharmonic: enharmonicsOf(SIXTH_COMMA)
    },

    // The four irregular temperaments are given fifth by fifth, as their sources
    // state them; a negative amount is a fifth stretched wider than pure.
    {
        slug: 'couperin', name: 'Couperin', group: 'French',
        note: 'An irregular French temperament close to quarter-comma meantone.',
        about: [
            'An irregular French scheme. Nine consecutive fifths, B♭ up to C♯, are narrowed by exactly a quarter comma, so the thirds on F, C, G, D, A and B♭ are pure just as they are in meantone.',
            'The other two fifths are widened rather than narrowed — E♭–B♭ by 7.8¢, C♯–G♯ by a quarter comma — so the 24.9¢ the nine narrowings overshoot by is shared over three intervals. The widest of them, the closing G♯–E♭ at 11.8¢, is still rough, but a third of meantone’s 35.7¢ wolf.'
        ],
        source: 'F. Couperin organ temperament (1690), from C. di Veroli — couperin_org.scl, Scala archive',
        cents: fromFifths(byLink({
            'E♭-B♭': -7.785, 'B♭-F': QUARTER, 'F-C': QUARTER, 'C-G': QUARTER,
            'G-D': QUARTER, 'D-A': QUARTER, 'A-E': QUARTER, 'E-B': QUARTER,
            'B-F♯': QUARTER, 'F♯-C♯': QUARTER, 'C♯-G♯': -QUARTER
        }))
    },
    {
        slug: 'rameau', name: 'Rameau', group: 'French',
        note: 'Rameau’s irregular temperament, favouring the common keys.',
        about: [
            'Six fifths from F up to B are narrowed by a quarter comma, holding the common keys in meantone and leaving the thirds on F, C and G pure. B♭–F and B–F♯ are left pure.',
            'The 8.8¢ the six narrowings overshoot by is shared out over four widened fifths rather than dumped on one, so there is no wolf: E♭–B♭ and F♯–C♯ take 1.5¢ each, C♯–G♯ and G♯–E♭ 2.9¢ each.'
        ],
        source: 'Standard French temperament, Rameau version (1726), C. di Veroli — rameau-french.scl, Scala archive',
        cents: fromFifths(byLink({
            'E♭-B♭': -1.532, 'F-C': QUARTER, 'C-G': QUARTER, 'G-D': QUARTER,
            'D-A': QUARTER, 'A-E': QUARTER, 'E-B': QUARTER,
            'F♯-C♯': -1.532, 'C♯-G♯': -2.868
        }))
    },
    {
        slug: 'rousseau', name: 'Rousseau III', group: 'French',
        note: 'A French irregular scheme with strongly coloured remote keys.',
        about: [
            'Six fifths from C up to F♯ are narrowed by a quarter comma, which leaves the thirds on C, G and D pure. F–C, F♯–C♯ and C♯–G♯ are left pure fifths.',
            'Three fifths are widened to close the circle: E♭–B♭ and G♯–E♭ at the ends of the chain by 3.5¢ each, and B♭–F by 1.8¢. That pushes the thirds on C♯, F♯ and G♯ out past the Pythagorean.'
        ],
        source: 'Standard French temperament Rousseau-3, C. di Veroli, 2002 — rousseau3.scl, Scala archive',
        cents: fromFifths(byLink({
            'E♭-B♭': -3.504, 'B♭-F': -1.792, 'C-G': QUARTER, 'G-D': QUARTER,
            'D-A': QUARTER, 'A-E': QUARTER, 'E-B': QUARTER, 'B-F♯': QUARTER
        }))
    },
    {
        slug: 'kirnberger', name: 'Kirnberger III', group: 'Well',
        note: 'A pure third in the home key, all twenty-four keys usable.',
        about: [
            'The four fifths C–G–D–A–E each give up a quarter of the syntonic comma, which is what leaves C–E exactly pure. Six of the other seven fifths in the chain are pure.',
            'That much tempering does not quite close the circle. F♯–C♯ absorbs the schisma — the 1.95¢ by which the Pythagorean comma exceeds the syntonic — and the twelfth fifth comes out pure, so there is no wolf anywhere.'
        ],
        source: 'Kirnberger III, letter to Forkel (1779) — kirnberger.scl, Scala archive',
        // C-E is left exactly pure by spending a whole syntonic comma on the four
        // fifths under it; the schisma on F♯-C♯ is what lets the circle close.
        cents: fromFifths(byLink({
            'C-G': SYNTONIC_COMMA / 4, 'G-D': SYNTONIC_COMMA / 4,
            'D-A': SYNTONIC_COMMA / 4, 'A-E': SYNTONIC_COMMA / 4,
            'F♯-C♯': SCHISMA
        }))
    },
    {
        slug: 'werckmeister', name: 'Werckmeister III', group: 'Well',
        note: 'The classic well temperament; each key keeps its own character.',
        about: [
            'Four fifths — C–G, G–D, D–A and B–F♯ — are each narrowed by a quarter of the Pythagorean comma. The other eight are pure, and because the four together account for the whole comma the circle closes with no wolf.',
            'Every key is playable and each keeps a different colour: C–E is 3.9¢ wide, while the thirds on the remote keys reach the full Pythagorean 21.5¢.'
        ],
        // 1681 is werck3.scl's own date; 1691 is cited at least as often, so this
        // repeats the archive rather than picking a side.
        source: 'Werckmeister’s temperament III (1681) — werck3.scl, Scala archive',
        cents: fromFifths(byLink({
            'C-G': PYTHAGOREAN_COMMA / 4, 'G-D': PYTHAGOREAN_COMMA / 4,
            'D-A': PYTHAGOREAN_COMMA / 4, 'B-F♯': PYTHAGOREAN_COMMA / 4
        }))
    },
    {
        slug: 'aron-neidhardt', name: 'Aron–Neidhardt', group: 'Well',
        // "Balancing meantone and equal" does not hold: seven fifths are pure, which
        // equal temperament never has, and seven of its twelve thirds are worse than it.
        note: 'A gentle well temperament balancing meantone and equal.',
        about: [
            'Five fifths from C up to B are tempered and the other seven left pure. The archive calls this the equal-beating version; its five take slightly different amounts — 4.5, 6.1, 5.4, 5.5 and 2.0¢ — rather than sharing one fraction of a comma.',
            'C–E lands 0.04¢ from pure and the circle closes without a wolf. It sits close to Kirnberger III without matching it — F♯ and B a schisma lower, G nearly a cent higher.'
        ],
        source: 'Aron–Neidhardt equal-beating well temperament — aron-neidhardt.scl, Scala archive',
        cents: fromFifths(byLink({
            'C-G': 4.492, 'G-D': 6.090, 'D-A': 5.391, 'A-E': 5.491, 'E-B': 1.997
        }))
    },
    {
        slug: 'vallotti', name: 'Vallotti', group: 'Well',
        // "A sixth comma" is the Pythagorean one here, 3.910¢; Meantone 1/6 uses the
        // same words for the syntonic, 3.584¢.
        note: 'Six fifths narrowed by a sixth comma, the rest left pure.',
        about: [
            'Six fifths in a row, F–C–G–D–A–E–B, are each narrowed by a sixth of the Pythagorean comma. The other six are pure, and the six sixths account for the whole comma, so the circle closes with no wolf.',
            'The thirds grow outward from the centre in even steps: 5.9¢ wide on F, C and G, and a full Pythagorean 21.5¢ on the most remote.'
        ],
        source: 'Vallotti & Young, Vallotti version, also known as Tartini–Vallotti (1754) — vallotti.scl, Scala archive',
        cents: fromFifths(byLink({
            'F-C': PYTHAGOREAN_COMMA / 6, 'C-G': PYTHAGOREAN_COMMA / 6, 'G-D': PYTHAGOREAN_COMMA / 6,
            'D-A': PYTHAGOREAN_COMMA / 6, 'A-E': PYTHAGOREAN_COMMA / 6, 'E-B': PYTHAGOREAN_COMMA / 6
        }))
    },
    {
        slug: 'equal', name: 'Equal Temperament', group: 'Modern',
        note: 'Twelve identical steps — every key alike, nothing pure.',
        about: [
            'Every fifth is narrowed by a twelfth of the Pythagorean comma, which is exactly the amount that lets twelve of them close seven octaves. The chain therefore has no end and no wolf: all twelve steps come out at 100¢, and any key sounds like any other.',
            'Nothing in it is pure. The fifths are only 2¢ narrow, which is hard to hear, but the major thirds are 13.7¢ wide — better than the Pythagorean third, worse than any central-key third in the meantone and well temperaments above. The minor thirds go the other way: at 15.6¢ narrow they beat what Kirnberger, Werckmeister, Aron–Neidhardt and Vallotti leave on C. It is here as a ruler for the rest.'
        ],
        source: 'Twelve equal divisions of the octave: every step is exactly 100¢ by definition, so there is no table to transcribe.',
        cents: fromFifths(EQUAL_COMMA)
    }
];

const TUNING_BY_SLUG = Object.fromEntries(TUNINGS.map(t => [t.slug, t]));
