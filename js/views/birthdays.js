import * as store from '../store.js';
import { t } from '../i18n.js';
import { esc, icon, $, todayISO, parseISO, toISO, daysBetween, toast, confirmBox } from '../util.js';
import { layout, fmtD } from '../ui.js';

/** Birthdays sorted by days until the next one. */
export function nextBirthdays(list) {
  const today = todayISO(); const y = Number(today.slice(0, 4));
  return list.map(b => {
    const [, m, d] = b.date.split('-').map(Number);
    // Feb 29 birthdays fall on Feb 28 in non-leap years.
    const mk = yr => { const dt = new Date(yr, m - 1, d); if (dt.getMonth() !== m - 1) dt.setDate(0); return toISO(dt); };
    let next = mk(y); if (next < today) next = mk(y + 1);
    const born = Number(b.date.slice(0, 4));
    const age = born > 1900 ? Number(next.slice(0, 4)) - born : null;
    return { ...b, next, days: daysBetween(today, next), age };
  }).sort((a, b) => a.days - b.days);
}

export default function birthdays(params) {
  const d = store.data(); const list = nextBirthdays(d.birthdays);
  const editing = params.id ? d.birthdays.find(b => b.id === params.id) : null;

  const body = `
  <form class="card stack" id="bf">
    <h3>${editing ? t('bday.edit') : t('bday.add')}</h3>
    <label class="field"><span>${t('bday.name')}</span><input class="input" name="name" required maxlength="60" value="${esc(editing?.name || '')}"></label>
    <label class="field"><span>${t('bday.date')}</span><input class="input" type="date" name="date" required value="${esc(editing?.date || '')}" max="${todayISO()}"></label>
    <p class="small muted" style="margin:0">${t('bday.hint')}</p>
    <div class="row">${editing ? `<a class="btn" href="#/birthdays">${t('cancel')}</a>` : ''}<span class="spacer"></span><button class="btn primary">${editing ? t('save') : t('bday.add')}</button></div>
  </form>
  <div class="section-title"><h2>${t('bday.upcoming')}</h2></div>
  ${list.length ? `<div class="list">${list.map(b => `
    <div class="list-row">
      <div class="countdown">${b.days === 0 ? '🎉' : b.days}<small>${b.days === 0 ? t('today') : t(b.days === 1 ? 'bday.day' : 'bday.days')}</small></div>
      <div class="label"><b>${esc(b.name)}</b><small>${fmtD(b.next)}${b.age ? ' · ' + t('bday.turns', { n: b.age }) : ''}</small></div>
      <a class="icon-btn" href="#/birthdays/${esc(b.id)}" aria-label="${t('edit')}">${icon('edit')}</a>
      <button class="icon-btn" data-del="${esc(b.id)}" aria-label="${t('delete')}">${icon('trash')}</button>
    </div>`).join('')}</div>`
    : `<div class="empty"><div class="big">🎂</div>${t('bday.none')}</div>`}`;

  return {
    title: t('menu.birthdays'), live: true,
    html: layout(t('menu.birthdays'), body, { back: '#/home', fab: false }),
    mount(root) {
      $('#bf', root).addEventListener('submit', e => {
        e.preventDefault(); const f = e.target.elements;
        try {
          store.saveBirthday({ id: editing?.id, name: f.name.value, date: f.date.value });
          toast(t('saved')); if (editing) location.hash = '#/birthdays';
        } catch (ex) { toast(t(ex.message)); }
      });
      root.addEventListener('click', async e => {
        const id = e.target.closest('[data-del]')?.dataset.del;
        if (id && await confirmBox(t('bday.confirmDelete'), t('delete'), t('cancel'))) store.deleteBirthday(id);
      });
    },
  };
}
