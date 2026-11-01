// All text shown in the app (English). Keeping it in one place makes wording
// easy to change, and another language could be added later as a second dictionary.

const en = {
  'app.tagline': 'Your day, neatly organized',
  back: 'Back', menu: 'Menu', open: 'Open', save: 'Save', saved: 'Saved', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
  enable: 'Turn on', today: 'Today', search: 'Search', voice: 'Speak', copied: 'Copied to clipboard',
  'profile.name': 'Your name',

  'nav.home': 'Home', 'nav.tasks': 'Tasks', 'nav.calendar': 'Calendar', 'nav.reports': 'Reports', 'nav.profile': 'Profile',
  'menu.categories': 'Categories', 'menu.theme': 'Theme', 'menu.birthdays': "Birthday countdown", 'menu.share': 'Share app',
  'menu.feedback': 'Feedback', 'menu.settings': 'Settings',

  'home.addName': 'Add your name', 'home.morning': 'Good morning', 'home.afternoon': 'Good afternoon', 'home.evening': 'Good evening',
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
  'set.monday': 'Monday', 'set.sunday': 'Sunday',
  'set.reminders': 'Reminders & sound', 'set.notifications': 'Notifications', 'set.notifSub': 'Reminders show while Remind Myself is open or installed',
  'set.notifDenied': 'Blocked — allow notifications in your browser settings', 'set.notifUnsupported': 'This browser cannot show notifications',
  'set.defaultReminder': 'Default reminder', 'set.tone': 'Task completion tone', 'set.preview': 'Play',
  'set.widgets': 'Widgets', 'set.widgetSub': 'Shown on the Home screen', 'set.homescreen': 'Add to phone home screen',
  'set.homescreenSub': 'Install Remind Myself like an app', 'set.install': 'Install',
  'set.installHint': 'Use your browser menu → "Add to Home screen" / "Install app".',
  'set.data': 'Your data', 'set.backup': 'Back up data', 'set.backupSub': 'Download a file to move to another device', 'set.restore': 'Restore from backup',
  'set.restored': 'Backup restored',
  'set.reset': 'Erase all data', 'set.resetSub': 'Delete every task, birthday and setting on this device', 'set.confirmReset': 'Erase all your tasks, birthdays and settings on this device? This cannot be undone.', 'set.resetDone': 'All data erased',
  'set.confirmResetSynced': "Erase all your tasks, birthdays and settings? You're signed in, so they will also be erased on your other devices.",
  'sync.title': 'Sync across devices', 'sync.notSetUp': 'Sync is not set up yet', 'sync.notSetUpSub': 'The app owner needs to connect a Firebase project (see SETUP-FIREBASE.md).',
  'sync.loadFailed': "Couldn't load sync — check your internet", 'sync.retry': 'Retry',
  'sync.pitch': 'Sign in to keep your tasks on all your phones and computers. Optional — the app works fine without it.',
  'sync.google': 'Continue with Google', 'sync.email': 'Use email and password',
  'sync.emailSub': 'Use the same email and password on every device you want to sync.',
  'sync.emailLabel': 'Email', 'sync.password': 'Password (min 6 characters)', 'sync.signIn': 'Sign in', 'sync.create': 'Create sync account',
  'sync.forgot': 'Forgot password?', 'sync.resetSent': 'Password reset email sent',
  'sync.signedIn': 'Signed in — syncing your tasks', 'sync.signedInAs': 'Signed in', 'sync.syncing': 'Syncing…', 'sync.synced': 'Up to date',
  'sync.offline': 'Offline — will sync when back online', 'sync.error': "Couldn't sync", 'sync.willRetry': 'Will try again shortly', 'sync.at': 'Last synced {time}',
  'sync.signOut': 'Sign out', 'sync.signOutSub': 'Stops syncing and clears this device. Your tasks stay safe in your account.',
  'sync.confirmSignOut': 'Sign out? Your tasks stay in your account, and this device will be cleared until you sign in again.', 'sync.signedOut': 'Signed out',
  'sync.errLogin': 'Email or password is incorrect.', 'sync.errEmail': 'Please enter a valid email.', 'sync.errTaken': 'That email already has an account — tap Sign in instead.',
  'sync.errWeak': 'Password must be at least 6 characters.', 'sync.errClosed': 'Sign-in was cancelled.', 'sync.errPopup': 'Your browser blocked the sign-in window. Allow pop-ups, or use email instead.',
  'sync.errNetwork': 'No internet connection.', 'sync.errTooMany': 'Too many attempts — please wait a minute.',
  'sync.errSetup': "This sign-in method isn't switched on in Firebase yet (see SETUP-FIREBASE.md).", 'sync.errGeneric': 'Something went wrong. Please try again.',
  'set.about': 'About', 'set.update': 'App updates', 'set.check': 'Check', 'set.version': 'Version {v}',

  'tone.chime': 'Chime', 'tone.bell': 'Bell', 'tone.pop': 'Pop', 'tone.none': 'Silent',
  'update.ready': 'A new version of Remind Myself is ready.', 'update.reload': 'Update now', 'update.later': 'Later',
  'update.latest': "You're on the latest version.", 'update.offline': "Couldn't check — you seem to be offline.", 'update.unavailable': 'Updates work once the app is installed or opened online.',

  'share.appText': 'I organize my daily tasks with Remind Myself — reminders, birthdays and reports. Try it:', 'share.via': 'shared from Remind Myself',
  'share.failed': "Couldn't share on this device",

  'err.name': 'Please enter your name.', 'err.title': 'Please enter a task title.', 'err.notFound': 'Task not found',
  'err.required': 'Please fill in all fields.', 'err.badBackup': "That file isn't a Remind Myself backup.", 'err.image': "Couldn't read that image.",
  'err.storage': 'Storage is full — try a smaller photo.', 'err.noVoice': 'Voice input is not supported in this browser.',
  'err.micBlocked': 'Microphone is blocked. Allow it in browser settings.', 'err.voiceFailed': "Didn't catch that — please try again.",
};

/** The app is English-only; date/time helpers still take a language code. */
export function lang() { return 'en'; }

/** Look up a text key. Unknown keys are returned as-is. */
export function t(key, vars) {
  let s = en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}
