// Voice input using the browser's Web Speech API (Chrome, Edge, Android, Safari 14.1+).
import { todayISO, addDays } from './util.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const voiceSupported = !!SR;

/** Start listening once. Resolves with the spoken text. */
export function listen(lang = 'en') {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('err.noVoice'));
    const rec = new SR();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false; rec.maxAlternatives = 1;
    let done = false;
    rec.onresult = e => { done = true; resolve(e.results[0][0].transcript.trim()); };
    rec.onerror = e => { done = true; reject(new Error(e.error === 'not-allowed' ? 'err.micBlocked' : 'err.voiceFailed')); };
    rec.onend = () => { if (!done) reject(new Error('err.voiceFailed')); };
    rec.start();
  });
}

/**
 * Pull a date and time out of a spoken sentence.
 * "call mom tomorrow at 6 pm" -> { title: "Call mom", date: <tomorrow>, time: "18:00" }
 */
export function parseSpoken(text) {
  let s = ` ${text} `; let date = null; let time = null;
  const today = todayISO();
  const rules = [
    [/\s(day after tomorrow|परसों|parso)\s/i, 2],
    [/\s(tomorrow|कल|kal)\s/i, 1],
    [/\s(today|tonight|आज|aaj)\s/i, 0],
  ];
  for (const [re, n] of rules) if (re.test(s)) { date = addDays(today, n); s = s.replace(re, ' '); break; }

  const tm = s.match(/\s(?:at\s+)?(\d{1,2})(?::|\.)?(\d{2})?\s*(a\.?m\.?|p\.?m\.?|बजे|baje)?\s/i);
  if (tm && (tm[3] || /\sat\s/i.test(tm[0]))) {
    let h = Number(tm[1]); const m = Number(tm[2] || 0); const ap = (tm[3] || '').toLowerCase().replace(/\./g, '');
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    if (!ap.startsWith('a') && !ap.startsWith('p') && h >= 1 && h <= 6) h += 12; // "at 5" / "5 baje" usually means evening
    if (h < 24 && m < 60) { time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; s = s.replace(tm[0], ' '); }
  }
  let title = s.replace(/\s+/g, ' ').trim().replace(/^(remind me to|remind me|add|i need to|i have to)\s+/i, '');
  title = title.charAt(0).toUpperCase() + title.slice(1);
  return { title, date, time };
}
