// GETKONG RUN · Namensfilter
//
// Läuft an zwei Stellen mit derselben Liste: im Browser (sofortige Rückmeldung)
// und in der Edge Function (die Stelle, die zählt — der Browser lässt sich
// umgehen). Deshalb steht die Liste in dieser einen Datei.
//
// Grundsatz: lieber ein paar harmlose Namen aussortieren als einen einzigen
// Nazi-Namen auf dem Monitor am Messestand. Wer abgelehnt wird, sieht eine
// neutrale Meldung und probiert einen anderen Namen — das kostet zehn Sekunden.

(function (global) {
  'use strict';

  // Rechtsextreme Codes und Zahlenkürzel. Die Zahlen sind der Grund, warum der
  // Filter nicht nur auf Buchstaben schauen darf: 88, 1488, 18, 14 werden als
  // ganze Wörter geprüft, sonst fällt jede Jahreszahl mit rein.
  // Als GANZES WORT gesperrt: allein stehend ist die Zahl die Aussage.
  var CODES = [
    '88', '18', '28', '38', '192', '444', '843', '168',
    'h8', 'ns', 'nsdap', 'ss', 'sa', 'hh'
  ];

  // Als FRAGMENT gesperrt, an beliebiger Stelle: dafuer gibt es keine harmlose
  // Lesart. Diese Liste wird gegen die Ziffern geprueft, nicht gegen die
  // leetspeak-aufgeloeste Fassung — sonst wuerde aus "1488" erst "ia88" und die
  // Pruefung ginge ins Leere. Genau daran ist die erste Fassung gescheitert.
  var ZAHLENCODES = ['1488', '8814', '14 88', '1919', '8818'];

  // Begriffe, die in jeder Schreibweise raus sollen. Bewusst als Fragmente:
  // "hitler" trifft auch "adolfhitler69".
  var BEGRIFFE = [
    'hitler', 'adolf', 'nazi', 'naxi', 'heilhit', 'sieghei', 'siegheil', 'hakenkreuz',
    'holocaust', 'auschwitz', 'judensau', 'judenfrei', 'zyklon', 'goebbels', 'himmler',
    'goering', 'göring', 'mussolini', 'faschist', 'fascho', 'arier', 'herrenrasse',
    'weisemacht', 'whitepower', 'wp88', 'kkk', 'kuklux', 'reichsbuerger', 'reichsbürger',
    'nigger', 'nigga', 'neger', 'kanake', 'kanacke', 'schlitzauge', 'zigeuner',
    'untermensch', 'volksverr', 'rassist', 'rassenkrieg', 'genozid', 'gaskammer',
    'schwuchtel', 'schwuchte', 'transe', 'tranny', 'faggot', 'fag', 'trannie',
    'vergewalt', 'kinderfick', 'kinderporn', 'pedo', 'paedo', 'pädo',
    'hurensohn', 'wichser', 'fotze', 'fick', 'fuck', 'shit', 'arschloch', 'bastard',
    'penis', 'schwanz', 'muschi', 'titten', 'vagina', 'porno', 'sex',
    'selbstmord', 'suizid', 'kys', 'killyourself',
    'heroin', 'kokain', 'crack', 'meth', 'crystalmeth',
    'blutundboden', 'blutehre',
    'admin', 'moderator', 'getkong', 'system', 'null', 'undefined'
  ];

  // Leetspeak und Trennzeichen zurückbauen, sonst rutscht "H1TL3R" oder
  // "n_a_z_i" durch. Umlaute werden aufgelöst, damit "göring" und "goering"
  // dieselbe Prüfung durchlaufen.
  function normalisieren(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[4@]/g, 'a').replace(/[3€]/g, 'e').replace(/[1!|]/g, 'i')
      .replace(/0/g, 'o').replace(/5\$/g, 's').replace(/7/g, 't').replace(/9/g, 'g')
      .replace(/[^a-z0-9]/g, '');
  }

  function pruefeName(roh) {
    var name = String(roh || '').trim();

    if (name.length < 2)  return { ok: false, grund: 'Mindestens zwei Zeichen.' };
    if (name.length > 14) return { ok: false, grund: 'Höchstens vierzehn Zeichen.' };

    // Nur Zeichen, die auf einem Monitor lesbar sind und keine Steuerzeichen
    // oder Rechts-nach-links-Marken enthalten.
    if (!/^[A-Za-z0-9ÄÖÜäöüß_. -]+$/.test(name)) {
      return { ok: false, grund: 'Nur Buchstaben, Zahlen, Punkt, Strich und Unterstrich.' };
    }

    var flach = normalisieren(name);
    if (!flach) return { ok: false, grund: 'Der Name braucht Buchstaben oder Zahlen.' };

    // Zweite Fassung ohne Leetspeak-Ersetzung, damit Ziffern Ziffern bleiben.
    var ziffern = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var z = 0; z < ZAHLENCODES.length; z++) {
      if (ziffern.indexOf(ZAHLENCODES[z].replace(/\s/g, '')) !== -1) {
        return { ok: false, grund: 'Der Name geht so nicht. Nimm bitte einen anderen.' };
      }
    }

    for (var i = 0; i < BEGRIFFE.length; i++) {
      if (flach.indexOf(BEGRIFFE[i]) !== -1) {
        return { ok: false, grund: 'Der Name geht so nicht. Nimm bitte einen anderen.' };
      }
    }

    // Zahlencodes nur als ganzes Wort — sonst wäre "1888er" gesperrt, obwohl
    // niemand etwas damit meint.
    var teile = String(name).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (var j = 0; j < teile.length; j++) {
      if (CODES.indexOf(teile[j]) !== -1) {
        return { ok: false, grund: 'Der Name geht so nicht. Nimm bitte einen anderen.' };
      }
    }
    // Reine Zahlenfolge sähe aus wie ein Spielcode.
    if (/^\d+$/.test(name)) {
      return { ok: false, grund: 'Nur Zahlen geht nicht — das sieht aus wie ein Code.' };
    }

    return { ok: true, name: name };
  }

  var api = { pruefeName: pruefeName, normalisieren: normalisieren,
              BEGRIFFE: BEGRIFFE, CODES: CODES, ZAHLENCODES: ZAHLENCODES };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Namensfilter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
