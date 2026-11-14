import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
for (const file of ['index.html', 'styles.css', 'app.js', 'backend-adapter.js']) {
  assert(fs.statSync(path.join(root, file)).size > 100, `Missing or empty ${file}`);
}
for (let index = 1; index <= 8; index += 1) {
  const file = `assets/backgrounds/bg-${String(index).padStart(2, '0')}.jpg`;
  assert(fs.statSync(path.join(root, file)).size > 1000, `Missing ${file}`);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
for (const marker of ['statusScreen', 'languageSwitch', 'rsvpForm', 'googleMap', 'twoGisMap', 'programList', 'id="guestCountPicker"', 'footerDate']) {
  assert(html.includes(marker), `Missing HTML marker ${marker}`);
}
for (const marker of ['env(safe-area-inset-right)', 'overflow-wrap:anywhere', 'prefers-reduced-motion', 'mask-image']) {
  assert(css.includes(marker), `Missing CSS safeguard ${marker}`);
}
for (const marker of ['fetchInvitationRaw', 'appendGuestToInvitation', 'IntersectionObserver', 'localStorage']) {
  assert(app.includes(marker), `Missing JS behavior ${marker}`);
}

const adapterUrl = pathToFileURL(path.join(root, 'backend-adapter.js')).href;
const adapter = await import(`${adapterUrl}?check=${Date.now()}`);
const sample = {
  public_id: 'pub-3',
  languages: { enabled: ['ru', 'ky', 'kk'], default: 'ru' },
  names: { groom: 'Бекзат', bride: 'Алина' },
  date: '2027-06-12T16:30:00',
  invitation: { ru: { title: 'Дорогие гости', text: 'Ждём вас' } },
  wish_block: { enabled: true, content: { ru: { title: 'Пожелание', text: 'Без цветов' } } },
  ceremonies: [
    { time: '18:00', sort_order: 2, content: { ru: { title: 'Ужин', text: '' } } },
    { time: '16:30', sort_order: 1, content: { ru: { title: 'Сбор гостей', text: '' } } }
  ],
  venue: { content: { ru: { type: 'Зал', name: 'Название', address: 'Бишкек' } }, map: { enabled: true } },
  rsvp: { enabled: true, allow_guest_wish: true, max_guests: 4 },
  guests: []
};
const normalized = adapter.normalizeInvitation(sample, 3);
assert.deepEqual(normalized.languages.enabled, ['ru', 'ky', 'kk']);
assert.equal(normalized.ceremonies[0].time, '16:30');
assert.equal(normalized.rsvp.maxGuests, 4);
assert.match(adapter.buildMapLinks(normalized.venue, 'ru', 'ru').google, /query=%D0%91/);
assert.equal(adapter.createGuestPayload({ name: 'Гость', isAttending: false, guestsCount: 9 }, 4).guests_count, 0);

console.log('Passed: assets, dynamic schema, languages, maps, RSVP endpoint, responsive safeguards, and seam blending.');
