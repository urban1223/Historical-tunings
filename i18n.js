(function () {
    'use strict';

    const translations = {
        en: {
            all: 'All', about: 'About', settings: 'Settings', explore: 'Explore',
            pureRatios: 'Pure Ratios',
            pureRatiosNote: 'Just intonation as ratios rather than twelve fixed notes — build one, hear it, and see where it falls between the keys.',
            aboutThis: 'About this temperament', turnOn: 'Turn on microphone', listening: 'Listening',
            referenceA: 'Reference A', waveform: 'Waveform', triangle: 'Triangle', sine: 'Sine',
            sawtooth: 'Sawtooth', swipe: 'Swipe to scroll', language: 'Language',
            chooseLanguage: 'Choose the language used by the app.', save: 'Language is saved on this device.',
            play: 'Play', stop: 'Stop', pure: 'pure', upperHarmonic: 'Upper harmonic', lowerHarmonic: 'Lower harmonic',
            soundUpper: 'Sound the upper note as', justIntonation: 'Just intonation',
            root: 'Root', compareAgainst: 'Compare against', tapRoot: 'Tap a key to set the root',
            licences: 'Licences'
        },
        sl: {
            all: 'Vse', about: 'O aplikaciji', settings: 'Nastavitve', explore: 'Razišči',
            pureRatios: 'Čista razmerja',
            pureRatiosNote: 'Čista intonacija kot razmerja namesto dvanajstih fiksnih tonov — sestavi razmerje, ga poslušaj in preveri njegov položaj med tipkami.',
            aboutThis: 'O tem temperamentu', turnOn: 'Vklopi mikrofon', listening: 'Poslušam',
            referenceA: 'Referenčni A', waveform: 'Valovna oblika', triangle: 'Trikotna', sine: 'Sinusna',
            sawtooth: 'Žagasta', swipe: 'Podrsaj za pomik', language: 'Jezik',
            chooseLanguage: 'Izberi jezik aplikacije.', save: 'Jezik se shrani v to napravo.',
            play: 'Predvajaj', stop: 'Ustavi', pure: 'čisto', upperHarmonic: 'Zgornji harmonik', lowerHarmonic: 'Spodnji harmonik',
            soundUpper: 'Predvajaj zgornji ton kot', justIntonation: 'Čista intonacija',
            root: 'Osnovni ton', compareAgainst: 'Primerjaj z', tapRoot: 'Dotakni se tipke za nastavitev osnovnega tona',
            licences: 'Licence'
        },
        de: {
            all: 'Alle', about: 'Über die App', settings: 'Einstellungen', explore: 'Entdecken',
            pureRatios: 'Reine Verhältnisse',
            pureRatiosNote: 'Reine Intonation als Verhältnisse statt zwölf fester Töne — erstelle ein Verhältnis, höre es und sieh seine Position zwischen den Tasten.',
            aboutThis: 'Über diese Stimmung', turnOn: 'Mikrofon einschalten', listening: 'Höre zu',
            referenceA: 'Referenz-A', waveform: 'Wellenform', triangle: 'Dreieck', sine: 'Sinus',
            sawtooth: 'Sägezahn', swipe: 'Wischen zum Scrollen', language: 'Sprache',
            chooseLanguage: 'Sprache der App auswählen.', save: 'Die Sprache wird auf diesem Gerät gespeichert.',
            play: 'Abspielen', stop: 'Stopp', pure: 'rein', upperHarmonic: 'Oberer Oberton', lowerHarmonic: 'Unterer Oberton',
            soundUpper: 'Oberen Ton spielen als', justIntonation: 'Reine Intonation',
            root: 'Grundton', compareAgainst: 'Vergleichen mit', tapRoot: 'Taste antippen, um den Grundton festzulegen',
            licences: 'Lizenzen'
        },
        es: {
            all: 'Todo', about: 'Acerca de', settings: 'Ajustes', explore: 'Explorar',
            pureRatios: 'Relaciones puras',
            pureRatiosNote: 'Entonación justa como relaciones en lugar de doce notas fijas: crea una, escúchala y comprueba dónde queda entre las teclas.',
            aboutThis: 'Sobre este temperamento', turnOn: 'Activar micrófono', listening: 'Escuchando',
            referenceA: 'La de referencia', waveform: 'Forma de onda', triangle: 'Triangular', sine: 'Seno',
            sawtooth: 'Diente de sierra', swipe: 'Desliza para desplazar', language: 'Idioma',
            chooseLanguage: 'Elige el idioma de la aplicación.', save: 'El idioma se guarda en este dispositivo.',
            play: 'Reproducir', stop: 'Detener', pure: 'pura', upperHarmonic: 'Armónico superior', lowerHarmonic: 'Armónico inferior',
            soundUpper: 'Reproducir la nota superior como', justIntonation: 'Entonación justa',
            root: 'Fundamental', compareAgainst: 'Comparar con', tapRoot: 'Toca una tecla para establecer la fundamental',
            licences: 'Licencias'
        }
    };

    const languageNames = { en: 'English', sl: 'Slovenščina', de: 'Deutsch', es: 'Español' };
    const supported = Object.keys(translations);
    const stored = localStorage.getItem('historical-tunings:language');
    const language = supported.indexOf(stored) >= 0 ? stored : 'en';
    const tr = key => (translations[language][key] || translations.en[key] || key);

    window.APP_LANGUAGE = language;
    window.t = tr;
    window.languageNames = languageNames;

    function applyLanguage() {
        document.documentElement.lang = language;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = tr(el.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = tr(el.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            el.setAttribute('aria-label', tr(el.dataset.i18nAriaLabel));
        });
        document.querySelectorAll('[data-language-option]').forEach(el => {
            el.textContent = languageNames[el.dataset.languageOption];
        });
    }

    window.setAppLanguage = function (next) {
        if (supported.indexOf(next) < 0) return;
        localStorage.setItem('historical-tunings:language', next);
        location.reload();
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyLanguage);
    else applyLanguage();
})();
