// Menu pages: Categories, Theme, Feedback, Settings.
import * as store from '../store.js';
import { t, setLang, LANGS } from '../i18n.js';
import { esc, icon, $, toast, confirmBox, download, todayISO, fmtDate } from '../util.js';
import { layout, catName } from '../ui.js';
import { TONES, playTone } from '../sound.js';
import { notificationState, askPermission } from '../reminders.js';
import { VERSION, checkForUpdate } from '../pwa.js';

const COLORS = ['#2f6f5e', '#4c7bd9', '#7a5bc7', '#d14d7a', '#d9822b', '#c9a227', '#3e9a62', '#2b8fb3', '#b4483a', '#5b6470'];
const EMOJIS = ['🙂', '💼', '🛒', '💪', '📚', '🎂', '⭐', '🏠', '🍳', '🧹', '💊', '🙏', '🎮', '✈️', '💰', '🐾', '🎨', '🏷️'];
const back = { back: '#/home', fab: false };

/* ---------------- Categories ---------------- */
export function categories(params) {
  const d = store.data(); const editing = params.id ? d.categories.find(c => c.id === params.id) : null;
  const sel = { color: editing?.color || COLORS[1], emoji: editing?.emoji || '🏷️' };
  const count = id => d.tasks.filter(x => x.category === id && !x.done).length;

  const body = `
  <div class="list">${d.categories.map(c => `
    <div class="list-row">
      <span class="avatar" style="background:${esc(c.color)};width:40px;height:40px">${esc(c.emoji)}</span>
      <a class="label" href="#/tasks?cat=${esc(c.id)}" style="color:inherit;text-decoration:none"><b>${esc(catName(c))}</b><small>${t('cat.pendingCount', { n: count(c.id) })}</small></a>
      <a class="icon-btn" href="#/categories/${esc(c.id)}" aria-label="${t('edit')}">${icon('edit')}</a>
      ${c.builtin ? '' : `<button class="icon-btn" data-del="${esc(c.id)}" aria-label="${t('delete')}">${icon('trash')}</button>`}
    </div>`).join('')}</div>

  <form class="card stack" id="cf" style="margin-top:16px">
    <h3>${editing ? t('cat.edit') : t('cat.new')}</h3>
    <label class="field"><span>${t('cat.name')}</span><input class="input" name="name" maxlength="40" ${editing?.builtin ? '' : 'required'} value="${esc(editing ? (editing.name || '') : '')}" placeholder="${editing?.builtin ? esc(t('cat.' + editing.id)) : t('cat.namePh')}"></label>
    <div><span class="small muted" style="font-weight:600">${t('cat.color')}</span>
      <div class="swatches" style="margin-top:8px">${COLORS.map(c => `<button type="button" class="swatch" style="background:${c}" data-color="${c}" aria-label="${c}" aria-pressed="${c === sel.color}"></button>`).join('')}</div></div>
    <div><span class="small muted" style="font-weight:600">${t('cat.icon')}</span>
      <div class="chips" style="flex-wrap:wrap;margin-top:8px">${EMOJIS.map(e => `<button type="button" class="chip" data-emoji="${e}" aria-pressed="${e === sel.emoji}">${e}</button>`).join('')}</div></div>
    <div class="row">${editing ? `<a class="btn" href="#/categories">${t('cancel')}</a>` : ''}<span class="spacer"></span><button class="btn primary">${editing ? t('save') : t('cat.add')}</button></div>
  </form>`;

  return {
    title: t('menu.categories'), live: true,
    html: layout(t('menu.categories'), body, back),
    mount(root) {
      root.addEventListener('click', async e => {
        const c = e.target.closest('[data-color]'), em = e.target.closest('[data-emoji]'), del = e.target.closest('[data-del]');
        if (c) { sel.color = c.dataset.color; root.querySelectorAll('[data-color]').forEach(x => x.setAttribute('aria-pressed', x === c)); }
        if (em) { sel.emoji = em.dataset.emoji; root.querySelectorAll('[data-emoji]').forEach(x => x.setAttribute('aria-pressed', x === em)); }
        if (del && await confirmBox(t('cat.confirmDelete'), t('delete'), t('cancel'))) store.deleteCategory(del.dataset.del);
      });
      $('#cf', root).addEventListener('submit', e => {
        e.preventDefault(); const name = e.target.elements.name.value.trim();
        if (!name && !editing?.builtin) return;
        store.saveCategory({ id: editing?.id, name: name || null, color: sel.color, emoji: sel.emoji });
        if (editing && !name && editing.builtin) { editing.name = null; store.save(); }
        toast(t('saved')); location.hash = '#/categories';
      });
    },
  };
}

/* ---------------- Theme ---------------- */
export function theme() {
  const th = store.getTheme();
  const body = `
  <div class="card stack">
    <h3>${t('theme.mode')}</h3>
    <div class="seg">${['system', 'light', 'dark'].map(m => `<button data-mode="${m}" aria-pressed="${th.mode === m}">${t('theme.' + m)}</button>`).join('')}</div>
  </div>
  <div class="card stack" style="margin-top:12px">
    <h3>${t('theme.accent')}</h3>
    <div class="swatches">${COLORS.map(c => `<button class="swatch" style="background:${c}" data-accent="${c}" aria-label="${c}" aria-pressed="${th.accent === c}"></button>`).join('')}</div>
    <label class="row"><span class="label">${t('theme.custom')}</span><input type="color" id="custom" value="${esc(th.accent)}" style="width:56px;height:40px;border:0;background:none"></label>
  </div>
  <div class="card" style="margin-top:12px"><p class="muted small" style="margin:0 0 10px">${t('theme.preview')}</p>
    <div class="row"><button class="btn primary">${t('task.add')}</button><span class="chip" aria-pressed="true">${t('cat.all')}</span></div></div>`;
  return {
    title: t('menu.theme'), live: false,
    html: layout(t('menu.theme'), body, back),
    mount(root, rerender) {
      const apply = patch => { store.setTheme({ ...store.getTheme(), ...patch }); rerender(); };
      root.addEventListener('click', e => {
        const m = e.target.closest('[data-mode]'), a = e.target.closest('[data-accent]');
        if (m) apply({ mode: m.dataset.mode });
        if (a) apply({ accent: a.dataset.accent });
      });
      $('#custom', root).addEventListener('change', e => apply({ accent: e.target.value }));
    },
  };
}

/* ---------------- Feedback ---------------- */
export function feedback() {
  const d = store.data();
  const body = `
  <form class="card stack" id="ff">
    <p class="muted" style="margin:0">${t('fb.intro')}</p>
    <div><span class="small muted" style="font-weight:600">${t('fb.rating')}</span>
      <div class="row" style="margin-top:6px" role="radiogroup">${[1, 2, 3, 4, 5].map(n => `<label class="chip" style="cursor:pointer"><input type="radio" name="rating" value="${n}" ${n === 5 ? 'checked' : ''} style="margin:0">${'★'.repeat(n)}</label>`).join('')}</div></div>
    <label class="field"><span>${t('fb.type')}</span><select class="input" name="type">
      ${['idea', 'bug', 'praise', 'other'].map(x => `<option value="${x}">${t('fb.' + x)}</option>`).join('')}</select></label>
    <label class="field"><span>${t('fb.message')}</span><textarea class="input" name="message" required maxlength="2000"></textarea></label>
    <button class="btn primary block">${t('fb.send')}</button>
  </form>
  ${d.feedback.length ? `<div class="section-title"><h2>${t('fb.history')}</h2></div><div class="list">${d.feedback.slice(-5).reverse().map(f => `
    <div class="list-row"><div class="label">${'★'.repeat(f.rating)} · ${esc(t('fb.' + f.type))}<small>${esc(f.message.slice(0, 120))}</small></div></div>`).join('')}</div>` : ''}`;
  return {
    title: t('menu.feedback'),
    html: layout(t('menu.feedback'), body, back),
    mount(root) {
      $('#ff', root).addEventListener('submit', e => {
        e.preventDefault(); const f = e.target.elements; const message = f.message.value.trim(); if (!message) return;
        const entry = { rating: Number(f.rating.value), type: f.type.value, message, at: Date.now() };
        d.feedback.push(entry); store.save();
        // Feedback goes to the project's GitHub Issues so the developer actually receives it.
        const url = `https://github.com/vKrypto/noob-learning-pg/issues/new?${new URLSearchParams({
          title: `[Feedback] ${t('fb.' + entry.type)} — ${'★'.repeat(entry.rating)}`,
          body: `${message}\n\n---\nRating: ${entry.rating}/5 · Type: ${entry.type} · App v${VERSION}`,
        })}`;
        window.open(url, '_blank', 'noopener');
        toast(t('fb.thanks'));
      });
    },
  };
}

/* ---------------- Settings ---------------- */
export function settingsPage() {
  const s = store.settings(); const perm = notificationState();
  const sample = todayISO();
  const row = (label, control, sub = '') => `<div class="list-row"><div class="label">${label}${sub ? `<small>${sub}</small>` : ''}</div>${control}</div>`;
  const sw = (key, on) => `<span class="switch"><input type="checkbox" data-key="${key}" ${on ? 'checked' : ''}><span></span></span>`;
  const select = (key, opts, val) => `<select class="input" data-key="${key}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;

  const body = `
  <div class="section-title"><h2>${t('set.general')}</h2></div>
  <div class="list">
    ${row(t('set.dateFormat'), select('dateFormat', ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'D MMM YYYY'].map(f => [f, fmtDate(sample, f, s.language)]), s.dateFormat))}
    ${row(t('set.weekStart'), select('weekStart', [[1, t('set.monday')], [0, t('set.sunday')]], s.weekStart), t('set.calendarSub'))}
    ${row(t('set.language'), select('language', LANGS.map(l => [l.code, l.name]), s.language))}
  </div>

  <div class="section-title"><h2>${t('set.reminders')}</h2></div>
  <div class="list">
    ${row(t('set.notifications'), perm === 'granted' || perm === 'unsupported' ? sw('notifications', s.notifications) : `<button class="btn sm primary" data-action="perm">${t('enable')}</button>`,
      perm === 'denied' ? t('set.notifDenied') : perm === 'unsupported' ? t('set.notifUnsupported') : t('set.notifSub'))}
    ${row(t('set.defaultReminder'), select('defaultReminder', [[-1, t('rem.none')], [0, t('rem.atTime')], [5, t('rem.minutes', { n: 5 })], [10, t('rem.minutes', { n: 10 })], [30, t('rem.minutes', { n: 30 })], [60, t('rem.hours', { n: 1 })]], s.defaultReminder))}
    ${row(t('set.tone'), `<div class="row">${select('tone', TONES.map(x => [x, t('tone.' + x)]), s.tone)}<button class="icon-btn" data-action="play" aria-label="${t('set.preview')}">▶</button></div>`)}
  </div>

  <div class="section-title"><h2>${t('set.widgets')}</h2></div>
  <div class="list">
    ${row(t('widget.week'), sw('widgets.week', s.widgets.week), t('set.widgetSub'))}
    ${row(t('widget.month'), sw('widgets.month', s.widgets.month), t('set.widgetSub'))}
    ${row(t('set.homescreen'), `<button class="btn sm" data-action="install">${t('set.install')}</button>`, t('set.homescreenSub'))}
  </div>

  <div class="section-title"><h2>${t('set.data')}</h2></div>
  <div class="list">
    ${row(t('set.backup'), `<button class="btn sm" data-action="export">${icon('download')}</button>`, t('set.backupSub'))}
    ${row(t('set.restore'), `<label class="btn sm">${icon('upload')}<input type="file" accept="application/json,.json" id="restore" hidden></label>`)}
    ${row(t('set.password'), `<button class="btn sm" data-action="pw">${t('edit')}</button>`)}
    ${row(`<span style="color:var(--danger)">${t('set.deleteAccount')}</span>`, `<button class="btn sm danger" data-action="delacc">${t('delete')}</button>`)}
  </div>

  <div class="section-title"><h2>${t('set.about')}</h2></div>
  <div class="list">
    ${row(t('set.update'), `<button class="btn sm" data-action="update">${icon('refresh')}${t('set.check')}</button>`, t('set.version', { v: VERSION }))}
  </div>`;

  return {
    title: t('menu.settings'),
    html: layout(t('menu.settings'), body, back),
    mount(root, rerender) {
      root.addEventListener('change', async e => {
        const key = e.target.dataset.key;
        if (key) {
          const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          const num = ['weekStart', 'defaultReminder'].includes(key) ? Number(val) : val;
          if (key.startsWith('widgets.')) s.widgets[key.split('.')[1]] = num; else s[key] = num;
          if (key === 'language') setLang(val);
          store.save(); if (key === 'tone') playTone(val);
          if (['language', 'dateFormat'].includes(key)) rerender();
          toast(t('saved'));
        }
        if (e.target.id === 'restore' && e.target.files[0]) {
          try { store.importData(await e.target.files[0].text()); toast(t('set.restored')); rerender(); }
          catch { toast(t('err.badBackup')); }
        }
      });
      root.addEventListener('click', async e => {
        const a = e.target.closest('[data-action]')?.dataset.action;
        if (a === 'play') playTone(s.tone);
        if (a === 'perm') { await askPermission(); rerender(); }
        if (a === 'export') download(`daynest-backup-${todayISO()}.json`, store.exportData(), 'application/json');
        if (a === 'install') {
          const p = window.__installPrompt;
          if (p) { p.prompt(); window.__installPrompt = null; } else toast(t('set.installHint'));
        }
        if (a === 'update') checkForUpdate(true);
        if (a === 'pw') passwordDialog();
        if (a === 'delacc' && await confirmBox(t('set.confirmDelete'), t('delete'), t('cancel'))) { await store.deleteAccount(); location.hash = '#/signin'; }
      });
    },
  };
}

function passwordDialog() {
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<form class="card stack" method="dialog">
    <h3>${t('set.password')}</h3>
    <label class="field"><span>${t('set.oldPw')}</span><input class="input" type="password" name="old" required autocomplete="current-password"></label>
    <label class="field"><span>${t('auth.passwordNew')}</span><input class="input" type="password" name="pw" required minlength="6" autocomplete="new-password"></label>
    <p class="error" role="alert"></p>
    <div class="row"><span class="spacer"></span><button class="btn" value="cancel" formnovalidate>${t('cancel')}</button><button class="btn primary" value="ok">${t('save')}</button></div>
  </form>`;
  document.body.appendChild(dlg); dlg.showModal();
  const form = dlg.querySelector('form');
  form.addEventListener('submit', async e => {
    if (e.submitter?.value === 'cancel') { dlg.remove(); return; }
    e.preventDefault();
    try { await store.changePassword(form.old.value, form.pw.value); dlg.close(); dlg.remove(); toast(t('saved')); }
    catch (ex) { form.querySelector('.error').textContent = t(ex.message); }
  });
  dlg.addEventListener('close', () => dlg.remove());
}
