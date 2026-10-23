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
    const slTunings = {
        pythagorean: {
            name: 'Pitagorejska', group: 'Stare',
            source: '12-tonska pitagorejska lestvica — pyth_12.scl, arhiv Scala',
            note: 'Same čiste kvinte, vendar za ceno zelo širokih terc.',
            about: [
                'Enajst čistih kvint je zloženih v verigo od E♭ do G♯. Ker nič ni temperirano, dvanajsta kvinta prevzame ves pitagorejski komat — volčji interval 23,5 centa med G♯ in E♭.',
                'Cena čistih kvint so terce: vsaka uporabna velika terca je za sintonski komat preširoka. Štiri skoraj čiste terce (C♯–F, F♯–B♭, G♯–C, B–E♭) so zmanjšane kvarte, napačno zapisane za tonaliteto, ki bi ji služile.'
            ]
        },
        violin: {
            name: 'Družina godal', group: 'Stare',
            source: 'Čiste kvinte; tabela je 12-tonska pitagorejska lestvica — pyth_12.scl, arhiv Scala',
            note: 'Prazne strune so uglašene v čistih kvintah — pitagorejsko v praksi.',
            about: [
                'Prazne strune družine godal so uglašene v čistih kvintah — G–D–A–E pri violini ter C–G–D–A pri violi in violončelu — zato je tabela pitagorejska veriga.',
                'Določene so samo prazne strune. Vse, kar pritisnemo s prsti, uglašujemo po posluhu glede na preostanek ansambla, zato tabela pove, kam nastaviti strune, ne pa kam položiti roko.'
            ]
        },
        meantone27: {
            name: 'Srednjetonska 2/7', group: 'Srednjetonske',
            source: 'Srednjetonska uglasitev z 2/7 komata, Zarlino (1558) — mean2sev.scl, arhiv Scala',
            note: 'Kvinte so močno znižane, velike in male terce pa enako odmaknjene.',
            about: [
                'Vsaka kvinta se odpove dvema sedminama sintonskega komata — več kot pri četrtinskem komatu, zato nobena kvinta in nobena terca ni čista. Dobimo simetrijo: velike terce so za 3,1 centa preozke in male terce za 3,1 centa preozke, obe so napačni za natanko enako mero. Edini čisti interval je kromatični polton, C–C♯ in njegovi štirje sorodniki, natanko 25/24.',
                'Enajst tako znižanih kvint pusti dvanajsti zelo veliko. G♯–E♭ je široka 44,1 centa, največji volčji interval tukaj, in z njim tudi štiri terce, ki ga prečkajo.'
            ]
        },
        meantone4: {
            name: 'Srednjetonska 1/4', group: 'Srednjetonske',
            source: 'Srednjetonska uglasitev z 1/4 komata, Pietro Aaron (1523) — meanquar.scl, arhiv Scala',
            note: 'Kvinte so znižane za četrtino komata, velike terce pa so čiste.',
            about: [
                'Vsaka kvinta je znižana za četrtino sintonskega komata — natanko toliko, da štiri zložene kvinte tvorijo čisto veliko terco. Osem od dvanajstih terc je čistih.',
                'Veriga se mora nekje skleniti. G♯–E♭ je široka 35,7 centa, klasični volčji interval, in štiri terce, ki ga prečkajo, niso uporabne.'
            ]
        },
        meantone6: {
            name: 'Srednjetonska 1/6', group: 'Srednjetonske',
            source: 'Srednjetonska uglasitev z 1/6 komata, Salinas — meansixth.scl, arhiv Scala',
            note: 'Blažja srednjetonska uglasitev; terce so rahlo široke, kvinte pa manj znižane.',
            about: [
                'Zgradba je enaka kot pri četrtinskem komatu, vendar se vsaka kvinta odpove le šestini sintonskega komata. Terce so za 7,2 centa preširoke, kvinte pa so precej bližje čistim.',
                'V zameno se volčji interval zmanjša s 35,7 na 16 centov, zato so oddaljene tonalitete spet uporabne.'
            ]
        },
        couperin: {
            name: 'Couperin', group: 'Francoske',
            source: 'Orgelska uglasitev F. Couperina (1690), po C. di Veroliju — couperin_org.scl, arhiv Scala',
            note: 'Nepravilna francoska uglasitev, blizu četrtinski srednjetonski.',
            about: [
                'Nepravilna francoska uglasitev. Devet zaporednih kvint od B♭ do C♯ je znižanih za natanko četrtino komata, zato so terce na F, C, G, D, A in B♭ čiste, tako kot pri srednjetonski uglasitvi.',
                'Preostali kvinti sta namesto znižanja razširjeni — E♭–B♭ za 7,8 centa in C♯–G♯ za četrtino komata — zato je 24,9 centa presežka razdeljenega med tri intervale. Najširša, zaključna G♯–E♭ pri 11,8 centa, je še vedno groba, vendar ima le tretjino volčjega intervala srednjetonske uglasitve.'
            ]
        },
        rameau: {
            name: 'Rameau', group: 'Francoske',
            source: 'Standardna francoska uglasitev, Rameaujeva različica (1726), C. di Veroli — rameau-french.scl, arhiv Scala',
            note: 'Rameaujeva nepravilna uglasitev, ki daje prednost običajnim tonalitetam.',
            about: [
                'Šest kvint od F do B je znižanih za četrtino komata, s čimer so običajne tonalitete srednjetonske, terce na F, C in G pa čiste. B♭–F in B–F♯ ostaneta čisti.',
                'Presežek 8,8 centa, ki ga ustvarja šest znižanj, je razdeljen med štiri razširjene kvinte, ne pa odložen na eno samo. Zato ni volčjega intervala: E♭–B♭ in F♯–C♯ dobita po 1,5 centa, C♯–G♯ in G♯–E♭ pa po 2,9 centa.'
            ]
        },
        rousseau: {
            name: 'Rousseau III', group: 'Francoske',
            source: 'Standardna francoska uglasitev Rousseau-3, C. di Veroli, 2002 — rousseau3.scl, arhiv Scala',
            note: 'Francoska nepravilna uglasitev z izrazito obarvanimi oddaljenimi tonalitetami.',
            about: [
                'Šest kvint od C do F♯ je znižanih za četrtino komata, zato so terce na C, G in D čiste. F–C, F♯–C♯ in C♯–G♯ ostanejo čiste kvinte.',
                'Tri kvinte sklenejo krog tako, da so razširjene: E♭–B♭ in G♯–E♭ na koncih verige za 3,5 centa, B♭–F pa za 1,8 centa. To terce na C♯, F♯ in G♯ potisne čez pitagorejsko mejo.'
            ]
        },
        kirnberger: {
            name: 'Kirnberger III', group: 'Dobro temperirane',
            source: 'Kirnberger III, pismo Forkelu (1779) — kirnberger.scl, arhiv Scala',
            note: 'Čista terca v osnovni tonaliteti; vseh 24 tonalitet je uporabnih.',
            about: [
                'Štiri kvinte C–G–D–A–E so znižane za četrtino sintonskega komata, zato je C–E natanko čista. Šest od preostalih sedmih kvint v verigi je čistih.',
                'Takšno temperiranje še ne sklene kroga povsem. F♯–C♯ prevzame shizmo — 1,95 centa, za kolikor pitagorejski komat presega sintonskega — dvanajsta kvinta pa je čista, zato nikjer ni volčjega intervala.'
            ]
        },
        werckmeister: {
            name: 'Werckmeister III', group: 'Dobro temperirane',
            source: 'Werckmeisterjeva uglasitev III (1681) — werck3.scl, arhiv Scala',
            note: 'Klasična dobro temperirana uglasitev; vsaka tonaliteta ohrani svoj značaj.',
            about: [
                'Štiri kvinte — C–G, G–D, D–A in B–F♯ — so vsaka znižana za četrtino pitagorejskega komata. Preostalih osem je čistih; ker štiri skupaj pokrijejo ves komat, se krog sklene brez volčjega intervala.',
                'Vsaka tonaliteta je uporabna in ima svojo barvo: C–E je široka 3,9 centa, terce v oddaljenih tonalitetah pa dosežejo vseh 21,5 centa pitagorejske terce.'
            ]
        },
        'aron-neidhardt': {
            name: 'Aron–Neidhardt', group: 'Dobro temperirane',
            source: 'Dobro temperirana uglasitev Aron–Neidhardt z enakim utripanjem — aron-neidhardt.scl, arhiv Scala',
            note: 'Nežna dobro temperirana uglasitev, ki uravnoteži srednjetonsko in enakomerno.',
            about: [
                'Pet kvint od C do B je temperiranih, preostalih sedem pa je čistih. Arhiv jo imenuje različica z enakim utripanjem; pet kvint je znižanih za nekoliko različne mere — 4,5, 6,1, 5,4, 5,5 in 2,0 centa — namesto za enak delež komata.',
                'C–E je od čiste terce oddaljena le 0,04 centa, krog pa se sklene brez volčjega intervala. Blizu je Kirnbergerju III, vendar se z njim ne ujema — F♯ in B sta za shizmo nižja, G pa skoraj za cent višji.'
            ]
        },
        vallotti: {
            name: 'Vallotti', group: 'Dobro temperirane',
            source: 'Vallotti in Young, različica Vallotti, znana tudi kot Tartini–Vallotti (1754) — vallotti.scl, arhiv Scala',
            note: 'Šest kvint je znižanih za šestino komata, preostale so čiste.',
            about: [
                'Šest zaporednih kvint, F–C–G–D–A–E–B, je znižanih za šestino pitagorejskega komata. Preostalih šest je čistih; šest šestin pokrije ves komat, zato se krog sklene brez volčjega intervala.',
                'Terce se od središča navzven večajo v enakomernih korakih: na F, C in G so široke 5,9 centa, v najbolj oddaljenih tonalitetah pa vseh 21,5 centa pitagorejske terce.'
            ]
        },
        equal: {
            name: 'Enakomerna uglasitev', group: 'Sodobne',
            source: 'Dvanajst enakih delitev oktave: vsak korak je po definiciji natanko 100 centov, zato tabele ni treba prepisati.',
            note: 'Dvanajst enakih korakov — vse tonalitete so enake, nič ni čisto.',
            about: [
                'Vsaka kvinta je znižana za dvanajstino pitagorejskega komata, natanko toliko, da se jih dvanajst sklene v sedem oktav. Veriga zato nima konca in volčjega intervala: vseh dvanajst korakov je velikih 100 centov in vsaka tonaliteta zveni enako kot druga.',
                'Nič ni čisto. Kvinte so le za 2 centa preozke, kar je težko slišati, velike terce pa so za 13,7 centa preširoke — boljše kot pri pitagorejski uglasitvi, slabše kot terce v osrednjih tonalitetah zgornjih srednjetonskih in dobro temperiranih uglasitev. Male terce so obratne: za 15,6 centa so preozke. Ta uglasitev je tukaj kot merilo za vse druge.'
            ]
        }
    };
    const tuningText = (name, group, note, first, second, source) => ({
        name, group, note, about: [first, second], source
    });
    const deTunings = {
        pythagorean: tuningText('Pythagoreisch', 'Antike',
            'Durchgehend reine Quinten, auf Kosten sehr weiter Terzen.',
            'Elf reine Quinten sind von E♭ bis G♯ zu einer Kette gestapelt. Nichts ist temperiert, daher trägt die zwölfte Quinte das gesamte pythagoreische Komma — die 23,5-Cent-Wolfsquinte zwischen G♯ und E♭.',
            'Der Preis der reinen Quinten wird bei den Terzen bezahlt: Jede verwendbare große Terz ist um ein syntonisches Komma zu weit. Die vier fast reinen Terzen (C♯–F, F♯–B♭, G♯–C, B–E♭) sind verminderte Quarten, die für ihre Tonart falsch geschrieben sind.',
            '12-tönige pythagoreische Tonleiter — pyth_12.scl, Scala-Archiv'),
        violin: tuningText('Streichinstrumente', 'Antike',
            'Leere Saiten in reinen Quinten — praktisch pythagoreisch gestimmt.',
            'Die leeren Saiten der Streichinstrumente sind in reinen Quinten gestimmt — G–D–A–E bei der Violine, C–G–D–A bei Bratsche und Cello — daher ist die Tabelle die pythagoreische Kette.',
            'Nur die leeren Saiten sind festgelegt. Alles, was mit den Fingern gegriffen wird, wird nach Gehör zum übrigen Ensemble gesetzt; die Tabelle zeigt also, wohin man die Saiten stimmt, nicht wohin man die Hand setzt.',
            'Reine Quinten; die Tabelle ist die 12-tönige pythagoreische Tonleiter — pyth_12.scl, Scala-Archiv'),
        meantone27: tuningText('Mitteltönig 2/7', 'Mitteltönig',
            'Stark verengte Quinten; große und kleine Terzen sind gleich weit abweichend.',
            'Jede Quinte gibt zwei Siebtel des syntonischen Kommas auf. Dadurch ist keine Quinte und keine Terz rein: große und kleine Terzen sind jeweils um 3,1 Cent zu eng. Das einzige reine Intervall ist der chromatische Halbton 25/24.',
            'Elf so stark temperierte Quinten lassen für die zwölfte sehr viel übrig. G♯–E♭ ist 44,1 Cent weit, die größte Wolfsquinte hier, und ebenso die vier Terzen, die sie überschreiten.',
            '2/7-Komma-Mittelton, Zarlino (1558) — mean2sev.scl, Scala-Archiv'),
        meantone4: tuningText('Mitteltönig 1/4', 'Mitteltönig',
            'Quinten um ein Viertelkomma verengt, mit reinen großen Terzen.',
            'Jede Quinte ist um ein Viertel des syntonischen Kommas verengt — genau so viel, dass vier gestapelte Quinten eine reine große Terz ergeben. Acht der zwölf Terzen sind rein.',
            'Die Kette muss sich irgendwo schließen. G♯–E♭ ist 35,7 Cent weit, die klassische Wolfsquinte, und die vier sie überschreitenden Terzen sind unbrauchbar.',
            '1/4-Komma-Mittelton, Pietro Aaron (1523) — meanquar.scl, Scala-Archiv'),
        meantone6: tuningText('Mitteltönig 1/6', 'Mitteltönig',
            'Milder Mitteltönig; Terzen leicht weit, Quinten weniger verengt.',
            'Wie beim Viertelkomma gibt jede Quinte nur ein Sechstel des syntonischen Kommas auf. Die Terzen sind statt rein 7,2 Cent weit, die Quinten liegen jedoch viel näher an rein.',
            'Dafür schrumpft die Wolfsquinte von 35,7 auf 16 Cent, wodurch entfernte Tonarten wieder erreichbar werden.',
            '1/6-Komma-Mittelton, Salinas — meansixth.scl, Scala-Archiv'),
        couperin: tuningText('Couperin', 'Französisch',
            'Unregelmäßige französische Stimmung, nahe am Viertelkomma-Mittelton.',
            'Neun aufeinanderfolgende Quinten von B♭ bis C♯ sind genau um ein Viertelkomma verengt, sodass die Terzen auf F, C, G, D, A und B♭ rein sind.',
            'Die beiden übrigen Quinten werden erweitert: E♭–B♭ um 7,8 Cent und C♯–G♯ um ein Viertelkomma. Der Überschuss verteilt sich auf drei Intervalle; die abschließende G♯–E♭ mit 11,8 Cent bleibt rau, ist aber nur ein Drittel so groß wie beim Mittelton.',
            'Orgelstimmung von F. Couperin (1690), nach C. di Veroli — couperin_org.scl, Scala-Archiv'),
        rameau: tuningText('Rameau', 'Französisch',
            'Rameaus unregelmäßige Stimmung für die gebräuchlichen Tonarten.',
            'Sechs Quinten von F bis B sind um ein Viertelkomma verengt. Die gebräuchlichen Tonarten bleiben mitteltönig und die Terzen auf F, C und G sind rein; B♭–F und B–F♯ bleiben reine Quinten.',
            'Der Überschuss von 8,8 Cent wird auf vier erweiterte Quinten verteilt, daher gibt es keine Wolfsquinte: E♭–B♭ und F♯–C♯ erhalten je 1,5 Cent, C♯–G♯ und G♯–E♭ je 2,9 Cent.',
            'Standardisierte französische Stimmung, Rameau-Version (1726), C. di Veroli — rameau-french.scl, Scala-Archiv'),
        rousseau: tuningText('Rousseau III', 'Französisch',
            'Französische unregelmäßige Stimmung mit stark gefärbten entfernten Tonarten.',
            'Sechs Quinten von C bis F♯ sind um ein Viertelkomma verengt, wodurch die Terzen auf C, G und D rein sind. F–C, F♯–C♯ und C♯–G♯ bleiben reine Quinten.',
            'Drei Quinten werden zum Schließen des Kreises erweitert: E♭–B♭ und G♯–E♭ an den Kettenenden um 3,5 Cent, B♭–F um 1,8 Cent. Dadurch werden die Terzen auf C♯, F♯ und G♯ pythagoreisch weit.',
            'Standardisierte französische Stimmung Rousseau-3, C. di Veroli, 2002 — rousseau3.scl, Scala-Archiv'),
        kirnberger: tuningText('Kirnberger III', 'Wohltemperiert',
            'Reine Terz in der Grundtonart; alle 24 Tonarten sind verwendbar.',
            'Die vier Quinten C–G–D–A–E geben jeweils ein Viertel des syntonischen Kommas auf, wodurch C–E genau rein wird. Sechs der übrigen sieben Quinten sind rein.',
            'F♯–C♯ nimmt das Schisma auf — 1,95 Cent, um die das pythagoreische Komma das syntonische übersteigt — und die zwölfte Quinte bleibt rein, daher gibt es nirgends eine Wolfsquinte.',
            'Kirnberger III, Brief an Forkel (1779) — kirnberger.scl, Scala-Archiv'),
        werckmeister: tuningText('Werckmeister III', 'Wohltemperiert',
            'Klassische wohltemperierte Stimmung; jede Tonart behält ihren eigenen Charakter.',
            'Vier Quinten — C–G, G–D, D–A und B–F♯ — sind jeweils um ein Viertel des pythagoreischen Kommas verengt. Die übrigen acht sind rein; zusammen schließen sie den Kreis ohne Wolfsquinte.',
            'Jede Tonart ist spielbar und hat eine eigene Farbe: C–E ist 3,9 Cent weit, während die Terzen entfernter Tonarten die vollen 21,5 Cent der pythagoreischen Terz erreichen.',
            'Werckmeisters Stimmung III (1681) — werck3.scl, Scala-Archiv'),
        'aron-neidhardt': tuningText('Aron–Neidhardt', 'Wohltemperiert',
            'Sanfte wohltemperierte Stimmung zwischen Mittelton und Gleichstufigkeit.',
            'Fünf Quinten von C bis B sind temperiert, die übrigen sieben bleiben rein. Die fünf werden unterschiedlich verengt — um 4,5, 6,1, 5,4, 5,5 und 2,0 Cent — statt um denselben Kommaanteil.',
            'C–E liegt nur 0,04 Cent von rein entfernt und der Kreis schließt ohne Wolfsquinte. Die Stimmung ist Kirnberger III ähnlich, aber nicht identisch.',
            'Aron–Neidhardt, gleichschwebende wohltemperierte Stimmung — aron-neidhardt.scl, Scala-Archiv'),
        vallotti: tuningText('Vallotti', 'Wohltemperiert',
            'Sechs Quinten um ein Sechstelkomma verengt, die übrigen rein.',
            'Sechs aufeinanderfolgende Quinten F–C–G–D–A–E–B sind jeweils um ein Sechstel des pythagoreischen Kommas verengt. Die übrigen sechs sind rein; der Kreis schließt ohne Wolfsquinte.',
            'Die Terzen wachsen vom Zentrum nach außen in gleichmäßigen Schritten: auf F, C und G sind sie 5,9 Cent weit, in den entlegensten Tonarten volle 21,5 Cent.',
            'Vallotti & Young, Vallotti-Version, auch Tartini–Vallotti (1754) — vallotti.scl, Scala-Archiv'),
        equal: tuningText('Gleichstufige Stimmung', 'Modern',
            'Zwölf gleiche Schritte — jede Tonart ist gleich, nichts ist rein.',
            'Jede Quinte ist um ein Zwölftel des pythagoreischen Kommas verengt, genau so viel, dass zwölf Quinten sieben Oktaven schließen. Alle zwölf Schritte sind 100 Cent groß.',
            'Nichts ist rein: Quinten sind nur 2 Cent zu eng, große Terzen aber 13,7 Cent zu weit. Diese Stimmung dient hier als Maßstab für die anderen.',
            'Zwölf gleiche Teilungen der Oktave: jeder Schritt ist per Definition genau 100 Cent — Scala-Archiv')
    };
    const esTunings = {
        pythagorean: tuningText('Pitagórica', 'Antigua',
            'Quintas justas en toda la escala, a costa de terceras muy anchas.',
            'Once quintas justas se apilan desde E♭ hasta G♯. Nada está temperado, así que la duodécima quinta contiene toda la coma pitagórica: la quinta de lobo de 23,5 cents entre G♯ y E♭.',
            'El precio de las quintas justas se paga en las terceras: cada tercera mayor utilizable es una coma sintónica demasiado ancha. Las cuatro casi justas son cuartas disminuidas escritas de forma incorrecta para su tonalidad.',
            'Escala pitagórica de 12 tonos — pyth_12.scl, archivo Scala'),
        violin: tuningText('Familia de cuerdas', 'Antiguas',
            'Cuerdas al aire afinadas en quintas justas: pitagórica en la práctica.',
            'Las cuerdas al aire de la familia de cuerdas se afinan en quintas justas: G–D–A–E en el violín y C–G–D–A en la viola y el violonchelo; por eso la tabla es la cadena pitagórica.',
            'Solo las cuerdas al aire están fijadas. Todo lo que se pisa con los dedos se coloca de oído según el resto del conjunto; la tabla indica cómo afinar las cuerdas, no dónde poner la mano.',
            'Quintas justas; la tabla es la escala pitagórica de 12 tonos — pyth_12.scl, archivo Scala'),
        meantone27: tuningText('Mesotónica 2/7', 'Mesotónicas',
            'Quintas muy estrechas, con terceras mayores y menores igualmente desviadas.',
            'Cada quinta cede dos séptimos de la coma sintónica, por lo que ninguna quinta ni tercera es justa. Las terceras mayores y menores quedan 3,1 cents estrechas. El único intervalo justo es el semitono cromático 25/24.',
            'Once quintas tan estrechas dejan mucho para la duodécima. G♯–E♭ mide 44,1 cents, la mayor quinta de lobo de esta colección, junto con las cuatro terceras que la atraviesan.',
            'Mesotónica de 2/7 de coma, Zarlino (1558) — mean2sev.scl, archivo Scala'),
        meantone4: tuningText('Mesotónica 1/4', 'Mesotónicas',
            'Quintas estrechas en un cuarto de coma, con terceras mayores justas.',
            'Cada quinta se estrecha un cuarto de la coma sintónica, justo lo necesario para que cuatro quintas apiladas formen una tercera mayor justa. Ocho de las doce terceras son justas.',
            'La cadena debe cerrarse en algún punto. G♯–E♭ mide 35,7 cents, la quinta de lobo clásica, y las cuatro terceras que la cruzan no son utilizables.',
            'Mesotónica de 1/4 de coma, Pietro Aaron (1523) — meanquar.scl, archivo Scala'),
        meantone6: tuningText('Mesotónica 1/6', 'Mesotónicas',
            'Mesotónica más suave; terceras algo anchas y quintas menos estrechas.',
            'La construcción es la misma que en el cuarto de coma, pero cada quinta cede solo un sexto de la coma sintónica. Las terceras quedan 7,2 cents anchas y las quintas se acercan mucho más a las justas.',
            'A cambio, la quinta de lobo se reduce de 35,7 a 16 cents y las tonalidades lejanas vuelven a ser utilizables.',
            'Mesotónica de 1/6 de coma, Salinas — meansixth.scl, archivo Scala'),
        couperin: tuningText('Couperin', 'Francesas',
            'Afinación francesa irregular, cercana a la mesotónica de cuarto de coma.',
            'Nueve quintas consecutivas, de B♭ a C♯, se estrechan exactamente un cuarto de coma, dejando justas las terceras de F, C, G, D, A y B♭.',
            'Las otras dos quintas se ensanchan: E♭–B♭ en 7,8 cents y C♯–G♯ en un cuarto de coma. El exceso se reparte entre tres intervalos y la quinta final G♯–E♭, de 11,8 cents, sigue siendo áspera pero es un tercio de la mesotónica.',
            'Afinación de órgano de F. Couperin (1690), según C. di Veroli — couperin_org.scl, archivo Scala'),
        rameau: tuningText('Rameau', 'Francesas',
            'Afinación irregular de Rameau que favorece las tonalidades comunes.',
            'Seis quintas de F a B se estrechan un cuarto de coma, manteniendo mesotónicas las tonalidades comunes y justas las terceras de F, C y G. B♭–F y B–F♯ quedan justas.',
            'El exceso de 8,8 cents se reparte entre cuatro quintas ensanchadas, así que no hay quinta de lobo: E♭–B♭ y F♯–C♯ reciben 1,5 cents, y C♯–G♯ y G♯–E♭, 2,9 cents.',
            'Afinación francesa estándar, versión de Rameau (1726), C. di Veroli — rameau-french.scl, archivo Scala'),
        rousseau: tuningText('Rousseau III', 'Francesas',
            'Afinación francesa irregular con tonalidades lejanas de color muy marcado.',
            'Seis quintas de C a F♯ se estrechan un cuarto de coma, dejando justas las terceras de C, G y D. F–C, F♯–C♯ y C♯–G♯ quedan como quintas justas.',
            'Tres quintas se ensanchan para cerrar el círculo: E♭–B♭ y G♯–E♭ en los extremos de la cadena, 3,5 cents cada una, y B♭–F en 1,8 cents. Las terceras de C♯, F♯ y G♯ quedan más anchas que las pitagóricas.',
            'Afinación francesa estándar Rousseau-3, C. di Veroli, 2002 — rousseau3.scl, archivo Scala'),
        kirnberger: tuningText('Kirnberger III', 'Bien temperadas',
            'Tercera justa en la tonalidad principal; las 24 tonalidades son utilizables.',
            'Las cuatro quintas C–G–D–A–E ceden un cuarto de la coma sintónica, dejando C–E exactamente justa. Seis de las otras siete quintas son justas.',
            'F♯–C♯ absorbe la esquisma, 1,95 cents, y la duodécima quinta queda justa, así que no hay quinta de lobo.',
            'Kirnberger III, carta a Forkel (1779) — kirnberger.scl, archivo Scala'),
        werckmeister: tuningText('Werckmeister III', 'Bien temperadas',
            'La clásica afinación bien temperada; cada tonalidad conserva su carácter.',
            'Cuatro quintas — C–G, G–D, D–A y B–F♯ — se estrechan un cuarto de la coma pitagórica. Las otras ocho son justas y el círculo se cierra sin quinta de lobo.',
            'Cada tonalidad es tocable y conserva su color: C–E mide 3,9 cents de ancho, mientras las terceras lejanas alcanzan los 21,5 cents pitagóricos.',
            'Afinación III de Werckmeister (1681) — werck3.scl, archivo Scala'),
        'aron-neidhardt': tuningText('Aron–Neidhardt', 'Bien temperadas',
            'Afinación bien temperada suave, entre la mesotónica y la igual.',
            'Cinco quintas de C a B están temperadas y las otras siete quedan justas. Las cinco se estrechan en cantidades distintas: 4,5, 6,1, 5,4, 5,5 y 2,0 cents.',
            'C–E queda a solo 0,04 cents de la justeza y el círculo se cierra sin quinta de lobo. Es cercana a Kirnberger III, pero no idéntica.',
            'Afinación bien temperada de batimientos iguales de Aron–Neidhardt — aron-neidhardt.scl, archivo Scala'),
        vallotti: tuningText('Vallotti', 'Bien temperadas',
            'Seis quintas estrechas un sexto de coma y las demás justas.',
            'Seis quintas consecutivas, F–C–G–D–A–E–B, se estrechan un sexto de la coma pitagórica. Las otras seis son justas y el círculo se cierra sin quinta de lobo.',
            'Las terceras crecen desde el centro hacia fuera: son 5,9 cents anchas en F, C y G, y alcanzan 21,5 cents en las tonalidades más lejanas.',
            'Vallotti y Young, versión Vallotti, también Tartini–Vallotti (1754) — vallotti.scl, archivo Scala'),
        equal: tuningText('Afinación igual', 'Modernas',
            'Doce pasos idénticos: todas las tonalidades son iguales y nada es justo.',
            'Cada quinta se estrecha un doceavo de la coma pitagórica, exactamente lo necesario para cerrar doce quintas en siete octavas. Los doce pasos miden 100 cents.',
            'Nada es justo: las quintas son solo 2 cents estrechas, pero las terceras mayores son 13,7 cents anchas. Aquí sirve como regla para comparar las demás.',
            'Doce divisiones iguales de la octava: cada paso mide exactamente 100 cents — archivo Scala')
    };
    const localizedTunings = { sl: slTunings, de: deTunings, es: esTunings };
    const supported = Object.keys(translations);
    const stored = localStorage.getItem('historical-tunings:language');
    const language = supported.indexOf(stored) >= 0 ? stored : 'en';
    const tr = key => (translations[language][key] || translations.en[key] || key);
    window.localizedTuning = function (tuning) {
        const translated = localizedTunings[language] && localizedTunings[language][tuning.slug];
        if (!translated) return tuning;
        return Object.assign({}, tuning, translated);
    };

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
