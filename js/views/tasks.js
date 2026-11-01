import * as store from '../store.js';
import { t } from '../i18n.js';
import { esc, icon, $, todayISO } from '../util.js';
import { layout, taskList, sortTasks, catName } from '../ui.js';

const state = { q: '', status: 'pending', cat: 'all', when: 'all' };

function filtered() {
  const d = store.data(); const q = state.q.trim().toLowerCase(); const today = todayISO();
  return sortTasks(d.tasks.filter(x =>
    (state.status === 'all' || (state.status === 'done' ? x.done : !x.done)) &&
    (state.cat === 'all' || x.category === state.cat) &&
    (state.when === 'all' || (state.when === 'today' ? x.date === today : state.when === 'upcoming' ? x.date > today : x.date < today)) &&
    (!q || x.title.toLowerCase().includes(q) || (x.notes || '').toLowerCase().includes(q) ||
      catName(d.categories.find(c => c.id === x.category) || { id: x.category }).toLowerCase().includes(q))
  ));
}

export default function tasks(params, query) {
  if (query.cat) { state.cat = query.cat; state.status = 'all'; }
  if (query.status) state.status = query.status;
  const d = store.data();
  const seg = (k, v, label) => `<button data-${k}="${v}" aria-pressed="${state[k] === v}">${label}</button>`;
  const list = filtered();

  const body = `
  <div class="input-wrap" role="search">
    <input class="input" type="search" id="q" placeholder="${t('search.placeholder')}" value="${esc(state.q)}" aria-label="${t('search')}" autocomplete="off">
    <span class="icon-btn" aria-hidden="true">${icon('search')}</span>
  </div>
  <div class="row wrap" style="margin-top:12px">
    <div class="seg">${seg('status', 'pending', t('status.pending'))}${seg('status', 'done', t('status.done'))}${seg('status', 'all', t('status.all'))}</div>
    <select class="input" id="when" style="width:auto;min-height:40px" aria-label="${t('filter.when')}">
      ${['all', 'today', 'upcoming', 'past'].map(w => `<option value="${w}" ${state.when === w ? 'selected' : ''}>${t('when.' + w)}</option>`).join('')}
    </select>
  </div>
  <div class="chips" style="margin-top:10px">
    <button class="chip" data-cat="all" aria-pressed="${state.cat === 'all'}">${t('cat.all')}</button>
    ${d.categories.map(c => `<button class="chip" data-cat="${esc(c.id)}" aria-pressed="${state.cat === c.id}"><span class="dot" style="background:${esc(c.color)}"></span>${esc(c.emoji)} ${esc(catName(c))}</button>`).join('')}
  </div>
  <p class="small muted" id="count" style="margin:8px 2px">${t('search.count', { n: list.length })}</p>
  <div id="results">${taskList(list, { highlight: state.q.trim(), empty: state.q ? t('search.none') : t('task.none') })}</div>`;

  return {
    title: t('nav.tasks'), live: true,
    html: layout(t('nav.tasks'), body, { tab: 'tasks' }),
    mount(root, rerender) {
      const refreshList = () => {
        const l = filtered();
        $('#results', root).innerHTML = taskList(l, { highlight: state.q.trim(), empty: state.q ? t('search.none') : t('task.none') });
        $('#count', root).textContent = t('search.count', { n: l.length });
      };
      $('#q', root).addEventListener('input', e => { state.q = e.target.value; refreshList(); });
      $('#when', root).addEventListener('change', e => { state.when = e.target.value; refreshList(); });
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-status],[data-cat]'); if (!b) return;
        if (b.dataset.status) state.status = b.dataset.status;
        if (b.dataset.cat) state.cat = b.dataset.cat;
        if (location.hash.includes('?')) history.replaceState(null, '', '#/tasks');
        rerender();
      });
    },
  };
}
