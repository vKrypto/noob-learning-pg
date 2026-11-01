// Translations. To add a language: add it to LANGS and add a dictionary below
// with the same keys (missing keys fall back to English).
import * as store from './store.js';

export const LANGS = [{ code: 'en', name: 'English' }, { code: 'hi', name: 'हिन्दी (Hindi)' }];

const en = {
  'app.tagline': 'Your day, neatly organized',
  back: 'Back', menu: 'Menu', open: 'Open', save: 'Save', saved: 'Saved', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
  enable: 'Turn on', today: 'Today', search: 'Search', voice: 'Speak', copied: 'Copied to clipboard',

  'auth.signin': 'Sign in', 'auth.signup': 'Create account', 'auth.welcomeBack': 'Welcome back', 'auth.create': 'Create your account',
  'auth.name': 'Your name', 'auth.email': 'Email', 'auth.password': 'Password', 'auth.passwordNew': 'Password (min 6 characters)',
  'auth.confirm': 'Confirm password', 'auth.show': 'Show password', 'auth.noAccount': 'New here?', 'auth.haveAccount': 'Already have an account?',
  'auth.localNote': 'Your account and tasks are saved securely on this device.',

  'nav.home': 'Home', 'nav.tasks': 'Tasks', 'nav.calendar': 'Calendar', 'nav.reports': 'Reports', 'nav.profile': 'Profile',
  'menu.categories': 'Categories', 'menu.theme': 'Theme', 'menu.birthdays': "Birthday countdown", 'menu.share': 'Share app',
  'menu.feedback': 'Feedback', 'menu.settings': 'Settings', 'menu.logout': 'Log out', 'menu.logoutConfirm': 'Log out of Remind Myself?',

  'home.morning': 'Good morning', 'home.afternoon': 'Good afternoon', 'home.evening': 'Good evening',
  'home.progress': '{done} of {total} tasks done today', 'home.nothingToday': 'No tasks for today yet',
  'home.enableNotif': 'Turn on notifications so reminders can reach you.', 'home.quoteLabel': 'Thought for today', 'home.newQuote': 'Another',
  'home.voiceAdd': 'Add a task by voice', 'home.overdue': 'Overdue', 'home.today': "Today's tasks", 'home.seeAll': 'See all',
  'home.emptyToday': 'Nothing planned. Tap + to add a task.',

  'widget.week': 'This week', 'widget.month': 'This month', 'widget.monthEmpty': 'Nothing else planned this month.',

  'task.add': 'Add task', 'task.new': 'New task', 'task.edit': 'Task details', 'task.title': 'What do you need to do?', 'task.titlePh': 'e.g. Read 20 pages',
  'task.category': 'Category', 'task.date': 'Date', 'task.time': 'Time', 'task.reminder': 'Reminder', 'task.repeat': 'Repeat',
  'task.high': 'High priority', 'task.notes': 'Notes', 'task.notesPh': 'Optional details', 'task.more': 'More',
  'task.markDone': 'Mark as done', 'task.markPending': 'Mark as not done', 'task.share': 'Share with friends',
  'task.gcal': 'Add to Google Calendar', 'task.ics': 'Download for any calendar (.ics)', 'task.delete': 'Delete task',
  'task.confirmDelete': 'Delete this task? This cannot be undone.', 'task.deleted': 'Task deleted', 'task.added': 'Task added', 'task.saved': 'Task saved',
  'task.none': 'No tasks here.', 'task.overdue': 'overdue', 'task.doneToast': 'Nice work! ✅', 'task.doneNext': 'Done! Next one set for {date}',
  'task.created': 'Created {date}', 'task.completedOn': 'Completed {date}',

  'rem.none': 'No reminder', 'rem.atTime': 'At the time', 'rem.minutes': '{n} min before', 'rem.hours': '{n} hr before', 'rem.dayBefore': '1 day before',
  'rem.now': 'Starting now', 'rem.inMin': 'Starts in {n} min',
  'repeat.none': 'Does not repeat', 'repeat.daily': 'Daily', 'repeat.weekly': 'Weekly', 'repeat.monthly': 'Monthly', 'repeat.yearly': 'Yearly',

  'status.pending': 'Pending', 'status.done': 'Completed', 'status.all': 'All',
  'filter.when': 'When', 'when.all': 'Any day', 'when.today': 'Today', 'when.upcoming': 'Upcoming', 'when.past': 'Past',
  'search.placeholder': 'Search tasks, notes, categories…', 'search.count': '{n} tasks', 'search.none': 'No matching tasks.',

  'cat.all': 'All', 'cat.personal': 'Personal', 'cat.professional': 'Professional', 'cat.shopping': 'Shopping', 'cat.health': 'Health routine',
  'cat.study': 'Study', 'cat.birthdays': 'Birthdays', 'cat.special': 'Special',
  'cat.pendingCount': '{n} pending', 'cat.new': 'New category', 'cat.edit': 'Edit category', 'cat.name': 'Name', 'cat.namePh': 'e.g. Gym',
  'cat.color': 'Color', 'cat.icon': 'Icon', 'cat.add': 'Add category', 'cat.confirmDelete': 'Delete this category? Its tasks move to Personal.',

  'cal.prev': 'Previous', 'cal.next': 'Next', 'cal.export': 'Export to calendar', 'cal.empty': 'No tasks on this day.',

  'report.weekly': 'Weekly', 'report.monthly': 'Monthly', 'report.streak': 'Day streak', 'report.byDay': 'Progress', 'report.planned': 'Planned',
  'report.byCategory': 'By category', 'report.empty': 'No tasks in this period.', 'report.wk': 'W',
  'report.tip': 'You completed {pct}% of planned tasks in this period. Small steps every day!',

  'profile.photo': 'Change photo', 'profile.removePhoto': 'Remove photo', 'profile.slogan': 'Your time-management slogan',
  'profile.todayDone': "Today's completion", 'profile.allDone': 'All-time done', 'profile.pending': 'Pending tasks', 'profile.noPending': 'All caught up! 🎉',
  'slogan.1': 'Plan the day, own the day.', 'slogan.2': 'One task at a time.', 'slogan.3': 'Done is better than perfect.', 'slogan.4': 'Today, not someday.',

  'bday.add': 'Add birthday', 'bday.edit': 'Edit birthday', 'bday.name': "Friend's name", 'bday.date': 'Birth date',
  'bday.hint': 'The year is used to show how old they turn. You get a reminder on the day.',
  'bday.upcoming': 'Coming up', 'bday.none': 'No birthdays saved yet.', 'bday.day': 'day', 'bday.days': 'days', 'bday.turns': 'turns {n}',
  'bday.todayTitle': "It's {name}'s birthday today! 🎂", 'bday.todayBody': 'Send them your wishes.', 'bday.soon': "{name}'s birthday is coming up",
  'bday.of': "{name}'s birthday", 'bday.confirmDelete': 'Remove this birthday?',

  'theme.mode': 'Appearance', 'theme.system': 'System', 'theme.light': 'Light', 'theme.dark': 'Dark', 'theme.accent': 'Accent color',
  'theme.custom': 'Pick any color', 'theme.preview': 'Preview',

  'fb.intro': 'Tell us what you like or what could be better. Sending opens a feedback form on GitHub.',
  'fb.rating': 'Rating', 'fb.type': 'Type', 'fb.message': 'Your message', 'fb.send': 'Send feedback', 'fb.thanks': 'Thank you for your feedback!',
  'fb.history': 'Your recent feedback', 'fb.idea': 'Idea', 'fb.bug': 'Something is broken', 'fb.praise': 'Praise', 'fb.other': 'Other',

  'set.general': 'General', 'set.dateFormat': 'Date format', 'set.weekStart': 'Calendar: week starts on', 'set.calendarSub': 'Used by Calendar and weekly reports',
  'set.monday': 'Monday', 'set.sunday': 'Sunday', 'set.language': 'Language',
  'set.reminders': 'Reminders & sound', 'set.notifications': 'Notifications', 'set.notifSub': 'Reminders show while Remind Myself is open or installed',
  'set.notifDenied': 'Blocked — allow notifications in your browser settings', 'set.notifUnsupported': 'This browser cannot show notifications',
  'set.defaultReminder': 'Default reminder', 'set.tone': 'Task completion tone', 'set.preview': 'Play',
  'set.widgets': 'Widgets', 'set.widgetSub': 'Shown on the Home screen', 'set.homescreen': 'Add to phone home screen',
  'set.homescreenSub': 'Install Remind Myself like an app', 'set.install': 'Install',
  'set.installHint': 'Use your browser menu → "Add to Home screen" / "Install app".',
  'set.data': 'Your data', 'set.backup': 'Back up data', 'set.backupSub': 'Download a file to move to another device', 'set.restore': 'Restore from backup',
  'set.restored': 'Backup restored', 'set.password': 'Change password', 'set.oldPw': 'Current password',
  'set.deleteAccount': 'Delete account', 'set.confirmDelete': 'Delete your account and all tasks on this device? This cannot be undone.',
  'set.about': 'About', 'set.update': 'App updates', 'set.check': 'Check', 'set.version': 'Version {v}',

  'tone.chime': 'Chime', 'tone.bell': 'Bell', 'tone.pop': 'Pop', 'tone.none': 'Silent',
  'update.ready': 'A new version of Remind Myself is ready.', 'update.reload': 'Update now', 'update.later': 'Later',
  'update.latest': "You're on the latest version.", 'update.offline': "Couldn't check — you seem to be offline.", 'update.unavailable': 'Updates work once the app is installed or opened online.',

  'share.appText': 'I organize my daily tasks with Remind Myself — reminders, birthdays and reports. Try it:', 'share.via': 'shared from Remind Myself',
  'share.failed': "Couldn't share on this device",

  'err.name': 'Please enter your name.', 'err.email': 'Please enter a valid email.', 'err.passwordShort': 'Password must be at least 6 characters.',
  'err.emailTaken': 'An account with this email already exists on this device.', 'err.badLogin': 'Email or password is incorrect.',
  'err.mismatch': "Passwords don't match.", 'err.title': 'Please enter a task title.', 'err.notFound': 'Task not found',
  'err.required': 'Please fill in all fields.', 'err.badBackup': "That file isn't a Remind Myself backup.", 'err.image': "Couldn't read that image.",
  'err.storage': 'Storage is full — try a smaller photo.', 'err.noVoice': 'Voice input is not supported in this browser.',
  'err.micBlocked': 'Microphone is blocked. Allow it in browser settings.', 'err.voiceFailed': "Didn't catch that — please try again.",
};

const hi = {
  'app.tagline': 'आपका दिन, सलीके से व्यवस्थित',
  back: 'वापस', menu: 'मेनू', open: 'खोलें', save: 'सहेजें', saved: 'सहेजा गया', cancel: 'रद्द करें', delete: 'हटाएँ', edit: 'बदलें',
  enable: 'चालू करें', today: 'आज', search: 'खोजें', voice: 'बोलें', copied: 'कॉपी हो गया',

  'auth.signin': 'साइन इन', 'auth.signup': 'खाता बनाएँ', 'auth.welcomeBack': 'फिर से स्वागत है', 'auth.create': 'अपना खाता बनाएँ',
  'auth.name': 'आपका नाम', 'auth.email': 'ईमेल', 'auth.password': 'पासवर्ड', 'auth.passwordNew': 'पासवर्ड (कम से कम 6 अक्षर)',
  'auth.confirm': 'पासवर्ड दोबारा लिखें', 'auth.show': 'पासवर्ड दिखाएँ', 'auth.noAccount': 'नए हैं?', 'auth.haveAccount': 'पहले से खाता है?',
  'auth.localNote': 'आपका खाता और काम इसी डिवाइस पर सुरक्षित रहते हैं।',

  'nav.home': 'होम', 'nav.tasks': 'काम', 'nav.calendar': 'कैलेंडर', 'nav.reports': 'रिपोर्ट', 'nav.profile': 'प्रोफ़ाइल',
  'menu.categories': 'श्रेणियाँ', 'menu.theme': 'थीम', 'menu.birthdays': 'जन्मदिन काउंटडाउन', 'menu.share': 'ऐप शेयर करें',
  'menu.feedback': 'प्रतिक्रिया', 'menu.settings': 'सेटिंग्स', 'menu.logout': 'लॉग आउट', 'menu.logoutConfirm': 'Remind Myself से लॉग आउट करें?',

  'home.morning': 'सुप्रभात', 'home.afternoon': 'नमस्कार', 'home.evening': 'शुभ संध्या',
  'home.progress': 'आज {total} में से {done} काम पूरे', 'home.nothingToday': 'आज के लिए अभी कोई काम नहीं',
  'home.enableNotif': 'रिमाइंडर पाने के लिए सूचनाएँ चालू करें।', 'home.quoteLabel': 'आज का विचार', 'home.newQuote': 'दूसरा',
  'home.voiceAdd': 'बोलकर काम जोड़ें', 'home.overdue': 'छूटे हुए', 'home.today': 'आज के काम', 'home.seeAll': 'सब देखें',
  'home.emptyToday': 'कुछ तय नहीं है। काम जोड़ने के लिए + दबाएँ।',

  'widget.week': 'इस हफ़्ते', 'widget.month': 'इस महीने', 'widget.monthEmpty': 'इस महीने और कुछ तय नहीं है।',

  'task.add': 'काम जोड़ें', 'task.new': 'नया काम', 'task.edit': 'काम का विवरण', 'task.title': 'क्या करना है?', 'task.titlePh': 'जैसे: 20 पन्ने पढ़ें',
  'task.category': 'श्रेणी', 'task.date': 'तारीख़', 'task.time': 'समय', 'task.reminder': 'रिमाइंडर', 'task.repeat': 'दोहराएँ',
  'task.high': 'ज़रूरी', 'task.notes': 'नोट्स', 'task.notesPh': 'अतिरिक्त जानकारी (वैकल्पिक)', 'task.more': 'और',
  'task.markDone': 'पूरा हुआ', 'task.markPending': 'अधूरा करें', 'task.share': 'दोस्तों से शेयर करें',
  'task.gcal': 'Google कैलेंडर में जोड़ें', 'task.ics': 'किसी भी कैलेंडर के लिए डाउनलोड (.ics)', 'task.delete': 'काम हटाएँ',
  'task.confirmDelete': 'यह काम हटाएँ? इसे वापस नहीं लाया जा सकता।', 'task.deleted': 'काम हटा दिया', 'task.added': 'काम जुड़ गया', 'task.saved': 'काम सहेजा गया',
  'task.none': 'यहाँ कोई काम नहीं।', 'task.overdue': 'देर हो गई', 'task.doneToast': 'शाबाश! ✅', 'task.doneNext': 'पूरा! अगला {date} के लिए तय',
  'task.created': '{date} को बनाया', 'task.completedOn': '{date} को पूरा',

  'rem.none': 'कोई रिमाइंडर नहीं', 'rem.atTime': 'ठीक समय पर', 'rem.minutes': '{n} मिनट पहले', 'rem.hours': '{n} घंटा पहले', 'rem.dayBefore': '1 दिन पहले',
  'rem.now': 'अभी शुरू', 'rem.inMin': '{n} मिनट में शुरू',
  'repeat.none': 'दोहराना नहीं', 'repeat.daily': 'रोज़', 'repeat.weekly': 'हर हफ़्ते', 'repeat.monthly': 'हर महीने', 'repeat.yearly': 'हर साल',

  'status.pending': 'बाकी', 'status.done': 'पूरे', 'status.all': 'सभी',
  'filter.when': 'कब', 'when.all': 'कोई भी दिन', 'when.today': 'आज', 'when.upcoming': 'आने वाले', 'when.past': 'बीते हुए',
  'search.placeholder': 'काम, नोट्स, श्रेणी खोजें…', 'search.count': '{n} काम', 'search.none': 'कोई मिलता-जुलता काम नहीं।',

  'cat.all': 'सभी', 'cat.personal': 'निजी', 'cat.professional': 'पेशेवर', 'cat.shopping': 'ख़रीदारी', 'cat.health': 'सेहत दिनचर्या',
  'cat.study': 'पढ़ाई', 'cat.birthdays': 'जन्मदिन', 'cat.special': 'ख़ास',
  'cat.pendingCount': '{n} बाकी', 'cat.new': 'नई श्रेणी', 'cat.edit': 'श्रेणी बदलें', 'cat.name': 'नाम', 'cat.namePh': 'जैसे: जिम',
  'cat.color': 'रंग', 'cat.icon': 'आइकन', 'cat.add': 'श्रेणी जोड़ें', 'cat.confirmDelete': 'यह श्रेणी हटाएँ? इसके काम "निजी" में चले जाएँगे।',

  'cal.prev': 'पिछला', 'cal.next': 'अगला', 'cal.export': 'कैलेंडर में भेजें', 'cal.empty': 'इस दिन कोई काम नहीं।',

  'report.weekly': 'साप्ताहिक', 'report.monthly': 'मासिक', 'report.streak': 'लगातार दिन', 'report.byDay': 'प्रगति', 'report.planned': 'तय',
  'report.byCategory': 'श्रेणी अनुसार', 'report.empty': 'इस अवधि में कोई काम नहीं।', 'report.wk': 'स',
  'report.tip': 'इस अवधि में आपने तय कामों का {pct}% पूरा किया। हर दिन छोटे कदम!',

  'profile.photo': 'फ़ोटो बदलें', 'profile.removePhoto': 'फ़ोटो हटाएँ', 'profile.slogan': 'समय प्रबंधन पर आपका नारा',
  'profile.todayDone': 'आज की प्रगति', 'profile.allDone': 'अब तक पूरे', 'profile.pending': 'बाकी काम', 'profile.noPending': 'सब पूरा! 🎉',
  'slogan.1': 'दिन की योजना बनाओ, दिन अपना बनाओ।', 'slogan.2': 'एक समय में एक काम।', 'slogan.3': 'पूरा करना, परफ़ेक्ट से बेहतर।', 'slogan.4': 'आज, कभी नहीं।',

  'bday.add': 'जन्मदिन जोड़ें', 'bday.edit': 'जन्मदिन बदलें', 'bday.name': 'दोस्त का नाम', 'bday.date': 'जन्म तिथि',
  'bday.hint': 'साल से उम्र दिखाई जाती है। उस दिन आपको रिमाइंडर मिलेगा।',
  'bday.upcoming': 'आने वाले', 'bday.none': 'अभी कोई जन्मदिन नहीं जोड़ा।', 'bday.day': 'दिन', 'bday.days': 'दिन', 'bday.turns': '{n} साल के होंगे',
  'bday.todayTitle': 'आज {name} का जन्मदिन है! 🎂', 'bday.todayBody': 'उन्हें शुभकामनाएँ भेजें।', 'bday.soon': '{name} का जन्मदिन आने वाला है',
  'bday.of': '{name} का जन्मदिन', 'bday.confirmDelete': 'यह जन्मदिन हटाएँ?',

  'theme.mode': 'दिखावट', 'theme.system': 'सिस्टम', 'theme.light': 'हल्की', 'theme.dark': 'गहरी', 'theme.accent': 'मुख्य रंग',
  'theme.custom': 'कोई भी रंग चुनें', 'theme.preview': 'झलक',

  'fb.intro': 'बताइए आपको क्या पसंद आया या क्या बेहतर हो सकता है। भेजने पर GitHub पर फ़ॉर्म खुलेगा।',
  'fb.rating': 'रेटिंग', 'fb.type': 'प्रकार', 'fb.message': 'आपका संदेश', 'fb.send': 'प्रतिक्रिया भेजें', 'fb.thanks': 'आपकी प्रतिक्रिया के लिए धन्यवाद!',
  'fb.history': 'आपकी हाल की प्रतिक्रियाएँ', 'fb.idea': 'सुझाव', 'fb.bug': 'कुछ ख़राब है', 'fb.praise': 'तारीफ़', 'fb.other': 'अन्य',

  'set.general': 'सामान्य', 'set.dateFormat': 'तारीख़ का प्रारूप', 'set.weekStart': 'कैलेंडर: हफ़्ता शुरू', 'set.calendarSub': 'कैलेंडर और साप्ताहिक रिपोर्ट में',
  'set.monday': 'सोमवार', 'set.sunday': 'रविवार', 'set.language': 'भाषा',
  'set.reminders': 'रिमाइंडर और ध्वनि', 'set.notifications': 'सूचनाएँ', 'set.notifSub': 'Remind Myself खुला या इंस्टॉल होने पर रिमाइंडर दिखते हैं',
  'set.notifDenied': 'बंद है — ब्राउज़र सेटिंग्स में अनुमति दें', 'set.notifUnsupported': 'यह ब्राउज़र सूचनाएँ नहीं दिखा सकता',
  'set.defaultReminder': 'डिफ़ॉल्ट रिमाइंडर', 'set.tone': 'काम पूरा होने की ध्वनि', 'set.preview': 'बजाएँ',
  'set.widgets': 'विजेट', 'set.widgetSub': 'होम स्क्रीन पर दिखेगा', 'set.homescreen': 'फ़ोन की होम स्क्रीन पर जोड़ें',
  'set.homescreenSub': 'Remind Myself को ऐप की तरह इंस्टॉल करें', 'set.install': 'इंस्टॉल',
  'set.installHint': 'ब्राउज़र मेनू → "होम स्क्रीन पर जोड़ें" / "ऐप इंस्टॉल करें"।',
  'set.data': 'आपका डेटा', 'set.backup': 'डेटा का बैकअप', 'set.backupSub': 'दूसरे डिवाइस पर ले जाने के लिए फ़ाइल डाउनलोड करें', 'set.restore': 'बैकअप से वापस लाएँ',
  'set.restored': 'बैकअप वापस आ गया', 'set.password': 'पासवर्ड बदलें', 'set.oldPw': 'मौजूदा पासवर्ड',
  'set.deleteAccount': 'खाता हटाएँ', 'set.confirmDelete': 'इस डिवाइस से आपका खाता और सभी काम हटाएँ? इसे वापस नहीं लाया जा सकता।',
  'set.about': 'जानकारी', 'set.update': 'ऐप अपडेट', 'set.check': 'जाँचें', 'set.version': 'संस्करण {v}',

  'tone.chime': 'झंकार', 'tone.bell': 'घंटी', 'tone.pop': 'पॉप', 'tone.none': 'शांत',
  'update.ready': 'Remind Myself का नया संस्करण तैयार है।', 'update.reload': 'अभी अपडेट करें', 'update.later': 'बाद में',
  'update.latest': 'आप नवीनतम संस्करण पर हैं।', 'update.offline': 'जाँच नहीं हो सकी — आप ऑफ़लाइन लगते हैं।', 'update.unavailable': 'ऐप ऑनलाइन खुलने पर अपडेट काम करेंगे।',

  'share.appText': 'मैं Remind Myself से अपने रोज़ के काम व्यवस्थित करता/करती हूँ — रिमाइंडर, जन्मदिन और रिपोर्ट। आज़माएँ:', 'share.via': 'Remind Myself से शेयर किया',
  'share.failed': 'इस डिवाइस पर शेयर नहीं हो सका',

  'err.name': 'कृपया अपना नाम लिखें।', 'err.email': 'कृपया सही ईमेल लिखें।', 'err.passwordShort': 'पासवर्ड कम से कम 6 अक्षर का हो।',
  'err.emailTaken': 'इस ईमेल से इस डिवाइस पर पहले से खाता है।', 'err.badLogin': 'ईमेल या पासवर्ड ग़लत है।',
  'err.mismatch': 'पासवर्ड मेल नहीं खाते।', 'err.title': 'कृपया काम का नाम लिखें।', 'err.notFound': 'काम नहीं मिला',
  'err.required': 'कृपया सभी जानकारी भरें।', 'err.badBackup': 'यह Remind Myself बैकअप फ़ाइल नहीं है।', 'err.image': 'यह फ़ोटो पढ़ी नहीं जा सकी।',
  'err.storage': 'जगह भर गई — छोटी फ़ोटो आज़माएँ।', 'err.noVoice': 'इस ब्राउज़र में आवाज़ से लिखना उपलब्ध नहीं।',
  'err.micBlocked': 'माइक्रोफ़ोन बंद है। ब्राउज़र सेटिंग्स में अनुमति दें।', 'err.voiceFailed': 'सुनाई नहीं दिया — फिर से कोशिश करें।',
};

const DICTS = { en, hi };

export function lang() {
  try { return store.currentUser() ? store.settings().language : (localStorage.getItem('dn.lang') || 'en'); }
  catch { return 'en'; }
}

export function setLang(code) {
  if (!DICTS[code]) return;
  try { localStorage.setItem('dn.lang', code); } catch {}
  if (store.currentUser()) { store.settings().language = code; store.save(); }
}

/** Translate a key. Unknown keys are returned as-is. */
export function t(key, vars) {
  const L = lang();
  let s = DICTS[L]?.[key] ?? en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}

export const _dicts = DICTS; // used by tests
