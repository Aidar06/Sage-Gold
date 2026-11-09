import {
  InvitationApiError,
  appendGuestToInvitation,
  buildMapLinks,
  fetchInvitationRaw,
  normalizeInvitation,
  resolveInvitationId
} from './backend-adapter.js';

const UI = {
  ru: {
    weddingLabel: 'Приглашение на свадьбу', scroll: 'Листайте вниз', dearLabel: 'Для самых близких',
    wishLabel: 'С заботой о деталях', dateLabel: 'Сохраните эту дату', countdownTitle: 'До нашей свадьбы осталось',
    programLabel: 'Этот особенный день', programTitle: 'Программа дня', venueLabel: 'Место торжества',
    answerLabel: 'Ваш ответ', rsvpTitle: 'Будете ли вы с нами?', rsvpLead: 'Пожалуйста, подтвердите своё присутствие.',
    nameLabel: 'Ваше имя', namePlaceholder: 'Как к вам обращаться?', attendanceLabel: 'Вы сможете прийти?',
    attendanceYes: 'Да, с радостью', attendanceNo: 'К сожалению, не смогу', guestCount: 'Количество гостей',
    guestWish: 'Ваше пожелание', wishPlaceholder: 'Несколько тёплых слов…', submit: 'Подтвердить участие',
    submitting: 'Отправляем…', success: 'Спасибо! Ваш ответ сохранён.', formError: 'Заполните имя и выберите вариант ответа.',
    sendError: 'Не удалось сохранить ответ. Попробуйте ещё раз.', withLove: 'С любовью', signature: 'С любовью,',
    loading: 'Загружаем приглашение…', notFound: 'Приглашение не найдено', loadError: 'Не удалось загрузить приглашение',
    retry: 'Попробовать снова', days: 'дней', hours: 'часов', minutes: 'минут', seconds: 'секунд'
  },
  ky: {
    weddingLabel: 'Үйлөнүү тоюна чакыруу', scroll: 'Ылдый сүрүңүз', dearLabel: 'Эң жакындарыбыз үчүн',
    wishLabel: 'Ар бир майда-баратка кам көрүү менен', dateLabel: 'Бул күндү белгилеп коюңуз', countdownTitle: 'Үйлөнүү тоюбузга калды',
    programLabel: 'Бул өзгөчө күн', programTitle: 'Күндүн программасы', venueLabel: 'Той өтүүчү жер',
    answerLabel: 'Сиздин жообуңуз', rsvpTitle: 'Биз менен болосузбу?', rsvpLead: 'Катышарыңызды ырастап коюңуз.',
    nameLabel: 'Сиздин атыңыз', namePlaceholder: 'Сизге кантип кайрылалы?', attendanceLabel: 'Тойго келе аласызбы?',
    attendanceYes: 'Ооба, кубануу менен', attendanceNo: 'Тилекке каршы, келе албайм', guestCount: 'Коноктордун саны',
    guestWish: 'Сиздин каалооңуз', wishPlaceholder: 'Бир нече жылуу сөз…', submit: 'Катышууну ырастоо',
    submitting: 'Жөнөтүлүүдө…', success: 'Рахмат! Жообуңуз сакталды.', formError: 'Атыңызды жазып, жообуңузду тандаңыз.',
    sendError: 'Жооп сакталган жок. Кайра аракет кылыңыз.', withLove: 'Сүйүү менен', signature: 'Сүйүү менен,',
    loading: 'Чакыруу жүктөлүүдө…', notFound: 'Чакыруу табылган жок', loadError: 'Чакыруу жүктөлгөн жок',
    retry: 'Кайра аракет кылуу', days: 'күн', hours: 'саат', minutes: 'мүнөт', seconds: 'секунд'
  },
  kk: {
    weddingLabel: 'Үйлену тойына шақыру', scroll: 'Төмен қарай сырғытыңыз', dearLabel: 'Ең жақындарымызға',
    wishLabel: 'Әрбір бөлшекке қамқорлықпен', dateLabel: 'Осы күнді сақтаңыз', countdownTitle: 'Тойымызға дейін қалды',
    programLabel: 'Осы ерекше күн', programTitle: 'Күн бағдарламасы', venueLabel: 'Той өтетін орын',
    answerLabel: 'Сіздің жауабыңыз', rsvpTitle: 'Бізбен бірге боласыз ба?', rsvpLead: 'Қатысатыныңызды растаңыз.',
    nameLabel: 'Сіздің атыңыз', namePlaceholder: 'Сізге қалай жүгінеміз?', attendanceLabel: 'Тойға келе аласыз ба?',
    attendanceYes: 'Иә, қуана келемін', attendanceNo: 'Өкінішке қарай, келе алмаймын', guestCount: 'Қонақтар саны',
    guestWish: 'Сіздің тілегіңіз', wishPlaceholder: 'Бірнеше жылы сөз…', submit: 'Қатысуды растау',
    submitting: 'Жіберілуде…', success: 'Рақмет! Жауабыңыз сақталды.', formError: 'Атыңызды жазып, жауабыңызды таңдаңыз.',
    sendError: 'Жауап сақталмады. Қайталап көріңіз.', withLove: 'Сүйіспеншілікпен', signature: 'Сүйіспеншілікпен,',
    loading: 'Шақыру жүктелуде…', notFound: 'Шақыру табылмады', loadError: 'Шақыру жүктелмеді',
    retry: 'Қайталап көру', days: 'күн', hours: 'сағат', minutes: 'минут', seconds: 'секунд'
  }
};

const LANGUAGE_LABELS = { ru: 'RU', ky: 'KG', kk: 'KZ' };
const LOCALES = { ru: 'ru-RU', ky: 'ky-KG', kk: 'kk-KZ' };
const WEEKDAYS = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  ky: ['Дш', 'Шш', 'Шр', 'Бш', 'Жм', 'Иш', 'Жк'],
  kk: ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс']
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  status: $('#statusScreen'), statusTitle: $('#statusTitle'), retry: $('#retryButton'), site: $('#site'),
  groom: $('#groomName'), bride: $('#brideName'), monogram: $('#monogramLetters'), heroDate: $('#heroDate'),
  invitationSection: $('#invitationSection'), invitationTitle: $('#invitationTitle'), invitationText: $('#invitationText'),
  invitationSignature: $('#invitationSignature'), wishSection: $('#wishSection'), wishTitle: $('#wishTitle'), wishText: $('#wishText'),
  dateSection: $('#dateSection'), dateDay: $('#dateDay'), dateMonth: $('#dateMonth'), dateYear: $('#dateYear'), dateTime: $('#dateTime'),
  calendarMonth: $('#calendarMonth'), calendarYear: $('#calendarYear'), calendarWeek: $('#calendarWeek'), calendarDays: $('#calendarDays'),
  countdown: $('#countdown'), countdownDays: $('#countdownDays'), countdownHours: $('#countdownHours'),
  countdownMinutes: $('#countdownMinutes'), countdownSeconds: $('#countdownSeconds'), programSection: $('#programSection'),
  programList: $('#programList'), venueSection: $('#venueSection'), venueType: $('#venueType'), venueName: $('#venueName'),
  venueAddress: $('#venueAddress'), mapActions: $('#mapActions'), googleMap: $('#googleMap'), twoGisMap: $('#twoGisMap'),
  rsvpSection: $('#rsvpSection'), form: $('#rsvpForm'), submit: $('#rsvpSubmit'), formStatus: $('#formStatus'),
  guestName: $('#guestName'), guestCount: $('#guestCount'), guestCountField: $('#guestCountField'),
  guestCountPicker: $('#guestCountPicker'), guestCountButton: $('#guestCountButton'),
  guestCountValue: $('#guestCountValue'), guestCountOptions: $('#guestCountOptions'),
  guestWish: $('#guestWish'), guestWishField: $('#guestWishField'), footerNames: $('#footerNames'), footerDate: $('#footerDate'),
  languageSwitch: $('#languageSwitch'), languageToggle: $('#languageToggle'), languageCurrent: $('#languageCurrent'),
  languageOptions: $('#languageOptions')
};

const state = {
  id: resolveInvitationId(location.pathname),
  raw: null,
  invitation: null,
  language: 'ru',
  languageOpen: false,
  guestPickerOpen: false,
  submitting: false,
  countdownTimer: null
};

function ui() {
  return UI[state.language] || UI.ru;
}

function storageKey() {
  return `priglasi-language-${state.id || 'unknown'}`;
}

function storedLanguage() {
  try { return localStorage.getItem(storageKey()) || ''; } catch { return ''; }
}

function setStatus(message, retry = false) {
  elements.status.hidden = false;
  elements.site.hidden = true;
  elements.statusTitle.textContent = message;
  elements.retry.textContent = ui().retry;
  elements.retry.hidden = !retry;
}

function localized(source) {
  return source?.[state.language] || source?.[state.invitation.languages.default] || source?.ru || {};
}

function safeDate() {
  if (!state.invitation?.dateISO) return null;
  const date = new Date(state.invitation.dateISO);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat(LOCALES[state.language], options).format(date);
}

function renderLabels() {
  const labels = ui();
  document.documentElement.lang = state.language;
  document.querySelectorAll('[data-ui]').forEach((node) => {
    const key = node.dataset.ui;
    if (labels[key]) node.textContent = labels[key];
  });
  elements.guestName.placeholder = labels.namePlaceholder;
  elements.guestWish.placeholder = labels.wishPlaceholder;
}

function renderNames() {
  const { groom, bride } = state.invitation.names;
  elements.groom.textContent = groom;
  elements.bride.textContent = bride;
  elements.monogram.textContent = `${groom.charAt(0)}${bride.charAt(0)}`.toUpperCase() || '♡';
  const joined = [groom, bride].filter(Boolean).join(' & ');
  elements.footerNames.textContent = joined;
  elements.invitationSignature.textContent = joined ? `${ui().signature} ${joined}` : '';
  document.title = joined ? `${joined} — ${ui().weddingLabel}` : ui().weddingLabel;
}

function renderInvitation() {
  const content = localized(state.invitation.invitation);
  const hasContent = Boolean(content.title || content.text);
  elements.invitationSection.hidden = !hasContent;
  elements.invitationTitle.textContent = content.title || '';
  elements.invitationTitle.hidden = !content.title;
  elements.invitationText.textContent = content.text || '';
  elements.invitationText.hidden = !content.text;
}

function renderWish() {
  const content = localized(state.invitation.wishBlock.content);
  const visible = state.invitation.wishBlock.enabled && Boolean(content.title || content.text);
  elements.wishSection.hidden = !visible;
  elements.wishTitle.textContent = content.title || '';
  elements.wishTitle.hidden = !content.title;
  elements.wishText.textContent = content.text || '';
  elements.wishText.hidden = !content.text;
}

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  elements.calendarMonth.textContent = formatDate(date, { month: 'long' });
  elements.calendarYear.textContent = String(year);
  elements.calendarWeek.replaceChildren(...WEEKDAYS[state.language].map((label) => {
    const node = document.createElement('span');
    node.textContent = label;
    return node;
  }));
  const cells = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    const node = document.createElement('span');
    node.className = 'empty';
    cells.push(node);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const node = document.createElement('span');
    node.textContent = String(day);
    if (day === date.getDate()) {
      node.className = 'wedding-day';
      node.setAttribute('aria-current', 'date');
    }
    cells.push(node);
  }
  elements.calendarDays.replaceChildren(...cells);
}

function updateCountdown() {
  const date = safeDate();
  if (!date) return;
  let distance = Math.max(0, date.getTime() - Date.now());
  const days = Math.floor(distance / 86400000); distance -= days * 86400000;
  const hours = Math.floor(distance / 3600000); distance -= hours * 3600000;
  const minutes = Math.floor(distance / 60000); distance -= minutes * 60000;
  const seconds = Math.floor(distance / 1000);
  elements.countdownDays.textContent = String(days);
  elements.countdownHours.textContent = String(hours).padStart(2, '0');
  elements.countdownMinutes.textContent = String(minutes).padStart(2, '0');
  elements.countdownSeconds.textContent = String(seconds).padStart(2, '0');
}

function renderDate() {
  const date = safeDate();
  elements.dateSection.hidden = !date;
  if (!date) return;
  elements.heroDate.textContent = formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' });
  elements.footerDate.textContent = `${formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' })} · ${formatDate(date, { hour: '2-digit', minute: '2-digit' })}`;
  elements.dateDay.textContent = String(date.getDate()).padStart(2, '0');
  elements.dateMonth.textContent = formatDate(date, { month: 'long' });
  elements.dateYear.textContent = String(date.getFullYear());
  elements.dateTime.textContent = formatDate(date, { hour: '2-digit', minute: '2-digit' });
  renderCalendar(date);
  updateCountdown();
  if (!state.countdownTimer) state.countdownTimer = setInterval(updateCountdown, 1000);
}

function renderProgram() {
  const items = state.invitation.ceremonies.filter((item) => item.time || item.title[state.language] || item.text[state.language]);
  elements.programSection.hidden = items.length === 0;
  const nodes = items.map((item) => {
    const node = document.createElement('li');
    node.className = 'program-item reveal';
    const time = document.createElement('p');
    time.className = 'program-time';
    time.textContent = item.time;
    const title = document.createElement('h3');
    title.textContent = item.title[state.language] || item.title[state.invitation.languages.default] || item.title.ru || '';
    const text = document.createElement('p');
    text.textContent = item.text[state.language] || item.text[state.invitation.languages.default] || item.text.ru || '';
    if (!time.textContent) time.hidden = true;
    if (!title.textContent) title.hidden = true;
    if (!text.textContent) text.hidden = true;
    node.append(time, title, text);
    return node;
  });
  elements.programList.replaceChildren(...nodes);
}

function renderVenue() {
  const content = localized(state.invitation.venue.content);
  const links = buildMapLinks(state.invitation.venue, state.language, state.invitation.languages.default);
  const visible = Boolean(content.type || content.name || content.address || links.enabled);
  elements.venueSection.hidden = !visible;
  elements.venueType.textContent = content.type || '';
  elements.venueType.hidden = !content.type;
  elements.venueName.textContent = content.name || '';
  elements.venueName.hidden = !content.name;
  elements.venueAddress.textContent = content.address || '';
  elements.venueAddress.hidden = !content.address;
  elements.googleMap.hidden = !links.google;
  elements.googleMap.href = links.google || '#';
  elements.twoGisMap.hidden = !links.twoGis;
  elements.twoGisMap.href = links.twoGis || '#';
  elements.mapActions.hidden = !links.google && !links.twoGis;
}

function renderRsvp() {
  const config = state.invitation.rsvp;
  elements.rsvpSection.hidden = !config.enabled;
  const selectedCount = Math.min(Math.max(Number(elements.guestCount.value) || 1, 1), config.maxGuests);
  const countOptions = Array.from({ length: config.maxGuests }, (_, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'guest-picker-option';
    option.dataset.value = String(index + 1);
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(index + 1 === selectedCount));
    option.textContent = String(index + 1);
    return option;
  });
  elements.guestCountOptions.replaceChildren(...countOptions);
  setGuestCount(selectedCount);
  elements.guestWishField.hidden = !config.allowGuestWish;
  elements.guestWish.disabled = !config.allowGuestWish;
}

function setGuestCount(value) {
  const count = String(value);
  elements.guestCount.value = count;
  elements.guestCountValue.textContent = count;
  elements.guestCountOptions.querySelectorAll('.guest-picker-option').forEach((option) => {
    option.setAttribute('aria-selected', String(option.dataset.value === count));
  });
}

function closeGuestPicker() {
  state.guestPickerOpen = false;
  elements.guestCountPicker.classList.remove('is-open');
  elements.guestCountButton.setAttribute('aria-expanded', 'false');
  elements.guestCountOptions.hidden = true;
}

function toggleGuestPicker() {
  if (elements.guestCountButton.disabled) return;
  state.guestPickerOpen = !state.guestPickerOpen;
  elements.guestCountPicker.classList.toggle('is-open', state.guestPickerOpen);
  elements.guestCountButton.setAttribute('aria-expanded', String(state.guestPickerOpen));
  elements.guestCountOptions.hidden = !state.guestPickerOpen;
}

function closeLanguageSwitch() {
  state.languageOpen = false;
  elements.languageSwitch.classList.remove('is-open');
  elements.languageCurrent.setAttribute('aria-expanded', 'false');
}

function renderLanguageSwitch() {
  const enabled = state.invitation.languages.enabled;
  elements.languageSwitch.hidden = enabled.length < 2;
  elements.languageCurrent.textContent = LANGUAGE_LABELS[state.language];
  const options = enabled.map((language) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `language-option${language === state.language ? ' is-active' : ''}`;
    button.dataset.language = language;
    button.textContent = LANGUAGE_LABELS[language];
    button.setAttribute('aria-label', `Язык ${LANGUAGE_LABELS[language]}`);
    return button;
  });
  elements.languageOptions.replaceChildren(...options);
}

function observeReveals() {
  const nodes = document.querySelectorAll('.reveal:not(.is-visible)');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, current) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      current.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  nodes.forEach((node) => observer.observe(node));
}

function render() {
  renderLabels();
  renderNames();
  renderInvitation();
  renderWish();
  renderDate();
  renderProgram();
  renderVenue();
  renderRsvp();
  renderLanguageSwitch();
  requestAnimationFrame(observeReveals);
}

function setLanguage(language) {
  if (!state.invitation.languages.enabled.includes(language)) return;
  const scrollPosition = window.scrollY;
  state.language = language;
  try { localStorage.setItem(storageKey(), language); } catch { /* storage may be unavailable */ }
  closeLanguageSwitch();
  render();
  window.scrollTo(0, scrollPosition);
  requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
}

async function load() {
  state.language = 'ru';
  setStatus(UI.ru.loading);
  if (!state.id) {
    setStatus(UI.ru.notFound, false);
    return;
  }
  try {
    const raw = await fetchInvitationRaw(state.id);
    if (!raw || typeof raw !== 'object' || (!raw.id && !raw.priglosi_id)) throw new InvitationApiError(404);
    state.raw = raw;
    state.invitation = normalizeInvitation(raw, state.id);
    const saved = storedLanguage();
    state.language = state.invitation.languages.enabled.includes(saved) ? saved : state.invitation.languages.default;
    elements.site.hidden = false;
    elements.status.hidden = true;
    render();
  } catch (error) {
    const missing = error instanceof InvitationApiError && error.status === 404;
    setStatus(missing ? UI.ru.notFound : UI.ru.loadError, !missing);
  }
}

elements.languageCurrent.addEventListener('click', () => {
  state.languageOpen = !state.languageOpen;
  elements.languageSwitch.classList.toggle('is-open', state.languageOpen);
  elements.languageCurrent.setAttribute('aria-expanded', String(state.languageOpen));
});

elements.languageOptions.addEventListener('click', (event) => {
  const button = event.target.closest('[data-language]');
  if (button) setLanguage(button.dataset.language);
});

document.addEventListener('pointerdown', (event) => {
  if (state.languageOpen && !elements.languageSwitch.contains(event.target)) closeLanguageSwitch();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeLanguageSwitch();
    closeGuestPicker();
  }
});

elements.guestCountButton.addEventListener('click', toggleGuestPicker);
elements.guestCountOptions.addEventListener('click', (event) => {
  const option = event.target.closest('.guest-picker-option');
  if (!option) return;
  setGuestCount(option.dataset.value);
  closeGuestPicker();
  elements.guestCountButton.focus();
});
document.addEventListener('click', (event) => {
  if (!elements.guestCountPicker.contains(event.target)) closeGuestPicker();
});

elements.form.addEventListener('change', (event) => {
  if (event.target.name !== 'attendance') return;
  const attending = event.target.value === 'yes';
  elements.guestCount.disabled = !attending;
  elements.guestCountButton.disabled = !attending;
  if (!attending) closeGuestPicker();
  elements.guestCountField.style.opacity = attending ? '1' : '.52';
});

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.submitting) return;
  const labels = ui();
  const data = new FormData(elements.form);
  const name = String(data.get('name') || '').trim();
  const attendance = String(data.get('attendance') || '');
  if (!name || !attendance) {
    elements.formStatus.textContent = labels.formError;
    elements.formStatus.className = 'form-status is-error';
    (!name ? elements.guestName : elements.form.querySelector('[name="attendance"]'))?.focus();
    return;
  }
  state.submitting = true;
  elements.submit.disabled = true;
  elements.submit.textContent = labels.submitting;
  elements.formStatus.textContent = '';
  elements.formStatus.className = 'form-status';
  try {
    const result = await appendGuestToInvitation(state.id, {
      name,
      wish: state.invitation.rsvp.allowGuestWish ? data.get('wish') : '',
      guestsCount: data.get('guests_count'),
      isAttending: attendance === 'yes'
    });
    state.raw = result.raw;
    state.invitation = result.invitation;
    elements.form.reset();
    elements.guestCount.disabled = false;
    elements.guestCountButton.disabled = false;
    setGuestCount(1);
    elements.guestCountField.style.opacity = '1';
    elements.formStatus.textContent = labels.success;
  } catch {
    elements.formStatus.textContent = labels.sendError;
    elements.formStatus.className = 'form-status is-error';
  } finally {
    state.submitting = false;
    elements.submit.disabled = false;
    elements.submit.textContent = labels.submit;
  }
});

elements.retry.addEventListener('click', load);
load();
