// Motivational quotes about time management (short, widely attributed sayings
// and a few original lines). One is picked per day.

export const QUOTES = [
  { text: 'Lost time is never found again.', by: 'Benjamin Franklin' },
  { text: 'The key is not to prioritize your schedule, but to schedule your priorities.', by: 'Stephen Covey' },
  { text: 'Well begun is half done.', by: 'Aristotle' },
  { text: 'Time is what we want most, but what we use worst.', by: 'William Penn' },
  { text: 'Until we can manage time, we can manage nothing else.', by: 'Peter Drucker' },
  { text: 'Do not wait; the time will never be just right.', by: 'Napoleon Hill' },
  { text: 'Small steps every day add up to big results.', by: 'Remind Myself' },
  { text: 'Write it down. A plan you can see is a plan you can keep.', by: 'Remind Myself' },
  { text: 'Your future is created by what you do today, not tomorrow.', by: 'Robert Kiyosaki' },
  { text: "Do tomorrow's work today, and today's work now.", by: 'Kabir' },
  { text: 'Focus on being productive instead of busy.', by: 'Tim Ferriss' },
  { text: 'One task at a time. Finish, then begin the next.', by: 'Remind Myself' },
];

export function quoteOfDay(date = new Date()) {
  const n = Math.floor(date.getTime() / 86400000);
  return QUOTES[n % QUOTES.length];
}
export function randomQuote(except) {
  let q; do { q = QUOTES[Math.floor(Math.random() * QUOTES.length)]; } while (q === except && QUOTES.length > 1);
  return q;
}
