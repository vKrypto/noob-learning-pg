import * as store from '../store.js';
import { t } from '../i18n.js';
import { esc, icon, $, todayISO, toast, imageToDataURL } from '../util.js';
import { layout, avatar, taskList, sortTasks, ring } from '../ui.js';

const SLOGANS = ['slogan.1', 'slogan.2', 'slogan.3', 'slogan.4'];

export default function profile() {
  const d = store.data(); const u = store.currentUser(); const today = todayISO();
  const todays = d.tasks.filter(x => x.date === today);
  const doneToday = todays.filter(x => x.done).length;
  const pct = todays.length ? Math.round(doneToday / todays.length * 100) : 0;
  const pending = sortTasks(d.tasks.filter(x => !x.done && x.date <= today));
  const upcoming = d.tasks.filter(x => !x.done && x.date > today).length;
  const allDone = d.tasks.filter(x => x.done).length;

  const body = `
  <section class="card" style="text-align:center">
    <label style="display:inline-block;position:relative;cursor:pointer" aria-label="${t('profile.photo')}">
      ${avatar('lg')}
      <span class="icon-btn" style="position:absolute;right:-6px;bottom:-6px;background:var(--accent);color:#fff;width:36px;height:36px;border-radius:50%">${icon('camera')}</span>
      <input type="file" accept="image/*" id="photo" hidden>
    </label>
    ${d.profile.photo ? `<div><button class="btn sm" data-action="rmphoto" style="margin-top:10px">${t('profile.removePhoto')}</button></div>` : ''}
    <form id="pf" class="stack" style="text-align:left;margin-top:16px">
      <label class="field"><span>${t('auth.name')}</span><input class="input" name="name" maxlength="60" value="${esc(u.name)}" required></label>
      <label class="field"><span>${t('profile.slogan')}</span><input class="input" name="slogan" maxlength="120" value="${esc(d.profile.slogan)}" placeholder="${t('slogan.1')}" list="slogans"></label>
      <datalist id="slogans">${SLOGANS.map(k => `<option value="${esc(t(k))}">`).join('')}</datalist>
      <button class="btn primary block">${t('save')}</button>
    </form>
    <p class="small muted" style="margin:10px 0 0">${esc(u.email)}</p>
  </section>

  <div class="section-title"><h2>${t('profile.todayDone')}</h2></div>
  <div class="card hero">${ring(pct)}<div class="stats" style="flex:1">
    <div class="stat"><b>${doneToday}/${todays.length}</b><span>${t('today')}</span></div>
    <div class="stat"><b>${upcoming}</b><span>${t('when.upcoming')}</span></div>
    <div class="stat"><b>${allDone}</b><span>${t('profile.allDone')}</span></div>
  </div></div>

  <div class="section-title"><h2>${t('profile.pending')} (${pending.length})</h2><a class="small" href="#/tasks?status=pending">${t('home.seeAll')}</a></div>
  ${taskList(pending.slice(0, 15), { empty: t('profile.noPending') })}`;

  return {
    title: t('nav.profile'), live: true,
    html: layout(t('nav.profile'), body, { tab: 'profile' }),
    mount(root) {
      $('#photo', root).addEventListener('change', async e => {
        const file = e.target.files[0]; if (!file) return;
        try { d.profile.photo = await imageToDataURL(file); if (!store.save()) toast(t('err.storage')); }
        catch { toast(t('err.image')); }
      });
      $('#pf', root).addEventListener('submit', e => {
        e.preventDefault(); const f = e.target.elements;
        store.renameUser(f.name.value); d.profile.slogan = f.slogan.value.trim(); store.save(); toast(t('saved'));
      });
      root.addEventListener('click', e => {
        if (e.target.closest('[data-action="rmphoto"]')) { d.profile.photo = null; store.save(); }
      });
    },
  };
}
