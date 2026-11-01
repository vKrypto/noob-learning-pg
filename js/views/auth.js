import * as store from '../store.js';
import { t, setLang, lang } from '../i18n.js';
import { esc, $, icon } from '../util.js';
import { quoteOfDay } from '../quotes.js';

function shell(inner) {
  const q = quoteOfDay();
  return `<div class="auth"><div class="card">
    <div class="brand"><img src="icons/icon.svg" alt=""><div><h1 style="text-transform:uppercase;letter-spacing:.04em;font-size:1.35rem">Remind Myself</h1><div class="small muted">${t('app.tagline')}</div></div></div>
    ${inner}
    <p class="small muted" style="margin:22px 0 0;text-align:center">“${esc(lang() === 'hi' ? q.hi : q.en)}”</p>
    <div class="row" style="justify-content:center;margin-top:10px">
      <button class="btn sm" data-lang="${lang() === 'hi' ? 'en' : 'hi'}">${lang() === 'hi' ? 'English' : 'हिन्दी'}</button>
    </div>
  </div></div>`;
}

const pwField = (name, label, auto) => `<label class="field"><span>${label}</span>
  <div class="input-wrap"><input class="input" type="password" name="${name}" required minlength="6" autocomplete="${auto}">
  <button type="button" class="icon-btn" data-action="peek" aria-label="${t('auth.show')}">${icon('eye')}</button></div></label>`;

export function signin() {
  return {
    title: t('auth.signin'),
    html: shell(`<form class="stack" novalidate>
      <h2>${t('auth.welcomeBack')}</h2>
      <label class="field"><span>${t('auth.email')}</span><input class="input" type="email" name="email" required autocomplete="email"></label>
      ${pwField('password', t('auth.password'), 'current-password')}
      <p class="error" role="alert"></p>
      <button class="btn primary block">${t('auth.signin')}</button>
      <p class="small" style="text-align:center;margin:8px 0 0">${t('auth.noAccount')} <a href="#/signup">${t('auth.signup')}</a></p>
    </form>`),
    mount: root => bind(root, async f => { await store.signIn({ email: f.email.value, password: f.password.value }); }),
  };
}

export function signup() {
  return {
    title: t('auth.signup'),
    html: shell(`<form class="stack" novalidate>
      <h2>${t('auth.create')}</h2>
      <label class="field"><span>${t('auth.name')}</span><input class="input" name="name" required autocomplete="name" maxlength="60"></label>
      <label class="field"><span>${t('auth.email')}</span><input class="input" type="email" name="email" required autocomplete="email"></label>
      ${pwField('password', t('auth.passwordNew'), 'new-password')}
      ${pwField('confirm', t('auth.confirm'), 'new-password')}
      <p class="error" role="alert"></p>
      <button class="btn primary block">${t('auth.signup')}</button>
      <p class="small muted" style="margin:6px 0 0">${t('auth.localNote')}</p>
      <p class="small" style="text-align:center;margin:8px 0 0">${t('auth.haveAccount')} <a href="#/signin">${t('auth.signin')}</a></p>
    </form>`),
    mount: root => bind(root, async f => {
      if (f.password.value !== f.confirm.value) throw new Error('err.mismatch');
      await store.signUp({ name: f.name.value, email: f.email.value, password: f.password.value });
    }),
  };
}

function bind(root, action) {
  const form = $('form', root); const err = $('.error', root);
  root.addEventListener('click', e => {
    const peek = e.target.closest('[data-action="peek"]');
    if (peek) { const i = peek.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; }
    const l = e.target.closest('[data-lang]');
    if (l) { setLang(l.dataset.lang); window.dispatchEvent(new HashChangeEvent('hashchange')); }
  });
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    const btn = $('button.primary', form); btn.disabled = true;
    try { await action(form.elements); location.hash = '#/home'; }
    catch (ex) { err.textContent = t(ex.message) || ex.message; }
    finally { btn.disabled = false; }
  });
  $('input', form)?.focus();
}
