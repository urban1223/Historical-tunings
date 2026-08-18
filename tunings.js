// ♯ and ♭ as artwork rather than font glyphs, so they render identically on
// every device. They inherit currentColor.
const ACCIDENTAL_SVG = {
    '♯': '<svg class="{cls}" viewBox="0 0 64 100" aria-hidden="true"><path d="M4 43 L60 30 L60 47 L4 60 Z"/><path d="M4 69 L60 56 L60 73 L4 86 Z"/><rect x="18" y="6" width="5.5" height="88"/><rect x="41" y="1" width="5.5" height="88"/></svg>',
    '♭': '<svg class="{cls}" viewBox="0 0 48 100" aria-hidden="true"><rect x="11" y="1" width="5.5" height="94"/><path d="M16.5 50 C 31 39, 46 49, 42.5 68 C 39 86, 25 92, 16.5 97 Z"/></svg>'
};

// Turns a note name like "C♯" into markup with the accidental as inline SVG
function withAccidentals(name, cls) {
    return name.replace(/[♯♭]/g, m => ACCIDENTAL_SVG[m].replace('{cls}', cls || 'accidental'));
}

// The twelve temperaments. Cents are measured from C. TASKS.md task 5 tracks
// deriving these from their constructions instead of hard-coding them.
const TUNINGS = [
    {
        slug: 'pythagorean', name: 'Pythagorean', group: 'Ancient',
        note: 'Pure fifths throughout, at the cost of very wide thirds.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 113.69, 204.00, 294.11, 407.82, 498.20, 611.75, 701.96, 815.63, 906.00, 996.13, 1109.87]
    },
    {
        slug: 'just', name: 'Just Intonation', group: 'Ancient',
        note: 'Built from simple whole-number ratios; pure in its home key.',
        noteNames: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0.00, 70.67, 183.31, 315.64, 384.36, 498.04, 563.38, 701.96, 772.63, 884.36, 990.37, 1088.27],
        enharmonic: [
            { idx: 1, options: [{ label: 'C♯', cents: 70.67 }, { label: 'D♭', cents: 111.73 }] },
            { idx: 3, options: [{ label: 'E♭', cents: 315.64 }, { label: 'D♯', cents: 274.58 }] },
            { idx: 6, options: [{ label: 'F♯', cents: 563.38 }, { label: 'G♭', cents: 590.22 }] },
            { idx: 8, options: [{ label: 'G♯', cents: 772.63 }, { label: 'A♭', cents: 813.69 }] },
            { idx: 10, options: [{ label: 'B♭', cents: 990.37 }, { label: 'A♯', cents: 976.54 }] }
        ]
    },
    {
        slug: 'violin', name: 'Violin Family', group: 'Ancient',
        note: 'Open strings tuned in pure fifths — Pythagorean in practice.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 113.69, 204.00, 294.11, 407.82, 498.20, 611.75, 701.96, 815.63, 906.00, 996.13, 1109.87]
    },
    {
        slug: 'meantone4', name: 'Meantone ¼', group: 'Meantone',
        note: 'Fifths narrowed by a quarter comma, giving pure major thirds.',
        noteNames: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 76.43, 193.53, 310.68, 386.73, 503.88, 579.74, 696.84, 772.63, 889.37, 1006.45, 1082.49],
        enharmonic: [
            { idx: 1, options: [{ label: 'C♯', cents: 76.43 }, { label: 'D♭', cents: 139.96 }] },
            { idx: 3, options: [{ label: 'E♭', cents: 310.68 }, { label: 'D♯', cents: 269.52 }] },
            { idx: 6, options: [{ label: 'F♯', cents: 579.52 }, { label: 'G♭', cents: 643.20 }] },
            { idx: 8, options: [{ label: 'G♯', cents: 772.63 }, { label: 'A♭', cents: 813.25 }] },
            { idx: 10, options: [{ label: 'B♭', cents: 1006.45 }, { label: 'A♯', cents: 965.48 }] }
        ]
    },
    {
        slug: 'meantone6', name: 'Meantone ⅙', group: 'Meantone',
        note: 'A milder meantone; thirds slightly wide, fifths less narrow.',
        noteNames: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0.00, 88.59, 196.74, 304.89, 393.48, 501.63, 590.22, 698.37, 786.96, 895.11, 1010.52, 1091.85],
        enharmonic: [
            { idx: 1, options: [{ label: 'C♯', cents: 88.59 }, { label: 'D♭', cents: 111.73 }] },
            { idx: 3, options: [{ label: 'E♭', cents: 304.89 }, { label: 'D♯', cents: 277.33 }] },
            { idx: 6, options: [{ label: 'F♯', cents: 590.22 }, { label: 'G♭', cents: 613.26 }] },
            { idx: 8, options: [{ label: 'G♯', cents: 786.96 }, { label: 'A♭', cents: 809.96 }] },
            { idx: 10, options: [{ label: 'B♭', cents: 1010.52 }, { label: 'A♯', cents: 975.22 }] }
        ]
    },
    {
        slug: 'early-french', name: 'Early French', group: 'French',
        note: 'An irregular French temperament close to quarter-comma meantone.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 76.43, 193.39, 297.23, 386.63, 503.74, 579.52, 696.00, 782.72, 889.37, 1006.45, 1082.73]
    },
    {
        slug: 'rameau', name: 'Rameau', group: 'French',
        note: 'Rameau’s irregular temperament, favouring the common keys.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 88.13, 193.36, 297.90, 386.32, 503.71, 585.11, 696.86, 793.18, 889.74, 1001.27, 1082.68]
    },
    {
        slug: 'rousseau', name: 'Rousseau III', group: 'French',
        note: 'A French irregular scheme with strongly coloured remote keys.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 81.76, 193.53, 289.24, 386.73, 498.66, 579.74, 696.84, 783.33, 889.37, 993.88, 1082.49]
    },
    {
        slug: 'kirnberger', name: 'Kirnberger III', group: 'Well',
        note: 'Pure thirds in the home keys, all twenty-four keys usable.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 90.22, 192.35, 294.27, 384.71, 498.71, 588.75, 696.11, 792.05, 888.27, 996.15, 1086.38]
    },
    {
        slug: 'werckmeister', name: 'Werckmeister III', group: 'Well',
        note: 'The classic well temperament; each key keeps its own character.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 90.22, 192.18, 294.13, 390.22, 498.04, 588.27, 696.09, 792.18, 888.27, 996.09, 1092.18]
    },
    {
        slug: 'aron-neidhardt', name: 'Aron–Neidhardt', group: 'Well',
        note: 'A gentle well temperament balancing meantone and equal.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 90.35, 193.53, 294.55, 386.73, 498.66, 588.72, 696.84, 792.19, 889.37, 995.84, 1085.86]
    },
    {
        slug: 'vallotti', name: 'Vallotti', group: 'Well',
        note: 'Six fifths narrowed by a sixth comma, the rest left pure.',
        noteNames: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
        cents: [0, 93.83, 196.12, 297.80, 391.68, 501.88, 592.01, 697.63, 795.55, 893.37, 999.46, 1089.60]
    }
];

const TUNING_BY_SLUG = Object.fromEntries(TUNINGS.map(t => [t.slug, t]));
