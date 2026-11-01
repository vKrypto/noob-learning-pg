// Motivational quotes about time management (short, widely attributed sayings
// and a few original lines). One is picked per day.

export const QUOTES = [
  { en: 'Lost time is never found again.', hi: 'खोया हुआ समय फिर कभी नहीं मिलता।', by: 'Benjamin Franklin' },
  { en: 'The key is not to prioritize your schedule, but to schedule your priorities.', hi: 'ज़रूरी यह नहीं कि समय-सारिणी को प्राथमिकता दें, बल्कि प्राथमिकताओं को समय दें।', by: 'Stephen Covey' },
  { en: 'Well begun is half done.', hi: 'अच्छी शुरुआत आधा काम है।', by: 'Aristotle' },
  { en: 'Time is what we want most, but what we use worst.', hi: 'समय वही है जो हम सबसे ज़्यादा चाहते हैं, पर सबसे बुरा इस्तेमाल करते हैं।', by: 'William Penn' },
  { en: 'Until we can manage time, we can manage nothing else.', hi: 'जब तक हम समय नहीं संभाल सकते, कुछ और नहीं संभाल सकते।', by: 'Peter Drucker' },
  { en: 'Do not wait; the time will never be just right.', hi: 'इंतज़ार मत करो; सही समय कभी पूरी तरह नहीं आता।', by: 'Napoleon Hill' },
  { en: 'Small steps every day add up to big results.', hi: 'हर दिन के छोटे कदम बड़े नतीजे बनाते हैं।', by: 'Remind Myself' },
  { en: 'Write it down. A plan you can see is a plan you can keep.', hi: 'लिख लीजिए। जो योजना दिखती है, वही निभती है।', by: 'Remind Myself' },
  { en: 'Your future is created by what you do today, not tomorrow.', hi: 'आपका भविष्य आज के काम से बनता है, कल के नहीं।', by: 'Robert Kiyosaki' },
  { en: 'Kal kare so aaj kar, aaj kare so ab.', hi: 'काल करे सो आज कर, आज करे सो अब।', by: 'Kabir' },
  { en: 'Focus on being productive instead of busy.', hi: 'व्यस्त रहने के बजाय उत्पादक बनने पर ध्यान दें।', by: 'Tim Ferriss' },
  { en: 'One task at a time. Finish, then begin the next.', hi: 'एक समय में एक काम। पूरा करें, फिर अगला शुरू करें।', by: 'Remind Myself' },
];

export function quoteOfDay(date = new Date()) {
  const n = Math.floor(date.getTime() / 86400000);
  return QUOTES[n % QUOTES.length];
}
export function randomQuote(except) {
  let q; do { q = QUOTES[Math.floor(Math.random() * QUOTES.length)]; } while (q === except && QUOTES.length > 1);
  return q;
}
