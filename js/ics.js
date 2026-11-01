// Calendar export: .ics files (Google, Apple, Outlook calendars) and Google Calendar links.
import { download, taskDateTime } from './util.js';

const pad = n => String(n).padStart(2, '0');
const utcStamp = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const dateOnly = iso => iso.replace(/-/g, '');
const escICS = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => '\\' + m);
const RRULE = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' };

function nextDay(iso) { const [y, m, d] = iso.split('-').map(Number); const x = new Date(y, m - 1, d + 1); return `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}`; }

function event(task) {
  const lines = ['BEGIN:VEVENT', `UID:${task.id}@daynest`, `DTSTAMP:${utcStamp(new Date())}`, `SUMMARY:${escICS(task.title)}`];
  if (task.time) {
    const start = taskDateTime(task); const end = new Date(start.getTime() + 30 * 60000);
    lines.push(`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${dateOnly(task.date)}`, `DTEND;VALUE=DATE:${nextDay(task.date)}`);
  }
  if (task.notes) lines.push(`DESCRIPTION:${escICS(task.notes)}`);
  if (RRULE[task.repeat]) lines.push(`RRULE:FREQ=${RRULE[task.repeat]}`);
  if (task.reminder != null && task.reminder >= 0) {
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escICS(task.title)}`, `TRIGGER:-PT${task.reminder}M`, 'END:VALARM');
  }
  lines.push('END:VEVENT');
  return lines;
}

export function buildICS(tasks) {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DayNest//Tasks//EN', 'CALSCALE:GREGORIAN',
    ...tasks.flatMap(event), 'END:VCALENDAR'].join('\r\n');
}

export function downloadICS(tasks, filename = 'daynest-tasks.ics') {
  download(filename.replace(/[\\/:*?"<>|]/g, '_'), buildICS(tasks), 'text/calendar');
}

export function googleCalendarUrl(task) {
  let dates;
  if (task.time) { const s = taskDateTime(task); dates = `${utcStamp(s)}/${utcStamp(new Date(s.getTime() + 30 * 60000))}`; }
  else dates = `${dateOnly(task.date)}/${nextDay(task.date)}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: task.title, dates, details: task.notes || '' });
  if (RRULE[task.repeat]) p.set('recur', `RRULE:FREQ=${RRULE[task.repeat]}`);
  return `https://calendar.google.com/calendar/render?${p}`;
}
