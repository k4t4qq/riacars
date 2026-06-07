const {
  firstValue,
  formatRace,
  escapeHTML,
  apiErrorText,
  readCache,
  writeCache,
  getBestPhotoUrl,
  addPhoto,
  descFilter,
} = require('../src/utils');

// ─── firstValue ──────────────────────────────────────────────────────────────

describe('firstValue', () => {
  test('returns the first defined non-empty value', () => {
    expect(firstValue(undefined, null, 'hello')).toBe('hello');
  });

  test('returns the first value when it is valid', () => {
    expect(firstValue('a', 'b', 'c')).toBe('a');
  });

  test('skips empty strings', () => {
    expect(firstValue('', '  ', 'valid')).toBe('valid');
  });

  test('returns 0 as a valid value', () => {
    expect(firstValue(0)).toBe(0);
  });

  test('returns undefined when no valid value exists', () => {
    expect(firstValue(undefined, null, '', '  ')).toBeUndefined();
  });

  test('handles no arguments', () => {
    expect(firstValue()).toBeUndefined();
  });
});

// ─── formatRace ──────────────────────────────────────────────────────────────

describe('formatRace', () => {
  test('returns dash when both values are undefined', () => {
    expect(formatRace(undefined, undefined)).toBe('—');
  });

  test('returns text with units unchanged if already has km/тис', () => {
    expect(formatRace('120 тис. км', undefined)).toBe('120 тис. км');
  });

  test('returns text with units if contains "km"', () => {
    expect(formatRace('50000 km', undefined)).toBe('50000 km');
  });

  test('formats numeric < 1000 as thousands of km', () => {
    expect(formatRace(150, undefined)).toBe('150 тис. км');
  });

  test('formats numeric >= 1000 with locale separator', () => {
    expect(formatRace(150000, undefined)).toBe('150,000 км');
  });

  test('uses raceInt as fallback when value is undefined', () => {
    expect(formatRace(undefined, 85)).toBe('85 тис. км');
  });

  test('prefers value over raceInt', () => {
    expect(formatRace(50, 100)).toBe('50 тис. км');
  });

  test('handles non-numeric strings', () => {
    expect(formatRace('N/A', undefined)).toBe('N/A');
  });

  test('handles zero', () => {
    expect(formatRace(0, undefined)).toBe('0 тис. км');
  });

  test('handles string numbers', () => {
    expect(formatRace('75', undefined)).toBe('75 тис. км');
  });
});

// ─── escapeHTML ──────────────────────────────────────────────────────────────

describe('escapeHTML', () => {
  test('escapes ampersand', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
  });

  test('escapes less-than', () => {
    expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
  });

  test('escapes greater-than', () => {
    expect(escapeHTML('a > b')).toBe('a &gt; b');
  });

  test('escapes double quotes', () => {
    expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
  });

  test('escapes single quotes', () => {
    expect(escapeHTML("it's")).toBe('it&#039;s');
  });

  test('handles multiple special characters', () => {
    expect(escapeHTML('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  test('handles null', () => {
    expect(escapeHTML(null)).toBe('');
  });

  test('handles undefined', () => {
    expect(escapeHTML(undefined)).toBe('');
  });

  test('handles numbers', () => {
    expect(escapeHTML(42)).toBe('42');
  });

  test('returns empty string for empty input', () => {
    expect(escapeHTML('')).toBe('');
  });

  test('leaves safe strings unchanged', () => {
    expect(escapeHTML('hello world')).toBe('hello world');
  });
});

// ─── apiErrorText ────────────────────────────────────────────────────────────

describe('apiErrorText', () => {
  test('returns limit message for ліміт error', () => {
    const err = new Error('ліміт перевищено');
    expect(apiErrorText(err, 'марок')).toBe('Ліміт API для марок. Спробуй трохи пізніше.');
  });

  test('returns limit message for limit error (English)', () => {
    const err = new Error('API limit reached');
    expect(apiErrorText(err, 'моделей')).toBe('Ліміт API для моделей. Спробуй трохи пізніше.');
  });

  test('returns limit message for HourOverlimit error', () => {
    const err = new Error('HourOverlimit');
    expect(apiErrorText(err, 'марок')).toBe('Ліміт API для марок. Спробуй трохи пізніше.');
  });

  test('returns generic error message for other errors', () => {
    const err = new Error('network timeout');
    expect(apiErrorText(err, 'марок')).toBe('Помилка завантаження марок');
  });

  test('handles null error', () => {
    expect(apiErrorText(null, 'фото')).toBe('Помилка завантаження фото');
  });

  test('handles error without message property', () => {
    expect(apiErrorText({}, 'марок')).toBe('Помилка завантаження марок');
  });
});

// ─── readCache / writeCache ──────────────────────────────────────────────────

describe('readCache', () => {
  let storage;

  beforeEach(() => {
    storage = {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, val) { this.store[key] = val; },
    };
  });

  test('returns empty array when key does not exist', () => {
    expect(readCache('missing', storage)).toEqual([]);
  });

  test('returns cached array', () => {
    storage.store['brands'] = JSON.stringify([{name: 'BMW', value: 9}]);
    expect(readCache('brands', storage)).toEqual([{name: 'BMW', value: 9}]);
  });

  test('returns empty array for non-array JSON', () => {
    storage.store['bad'] = JSON.stringify({foo: 'bar'});
    expect(readCache('bad', storage)).toEqual([]);
  });

  test('returns empty array for invalid JSON', () => {
    storage.store['broken'] = 'not json{{{';
    expect(readCache('broken', storage)).toEqual([]);
  });
});

describe('writeCache', () => {
  let storage;

  beforeEach(() => {
    storage = {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, val) { this.store[key] = val; },
    };
  });

  test('writes value to storage', () => {
    writeCache('key1', [1, 2, 3], storage);
    expect(JSON.parse(storage.store['key1'])).toEqual([1, 2, 3]);
  });

  test('does not throw when storage.setItem throws', () => {
    const brokenStorage = {
      setItem() { throw new Error('quota exceeded'); },
    };
    expect(() => writeCache('k', [1], brokenStorage)).not.toThrow();
  });
});

// ─── getBestPhotoUrl ─────────────────────────────────────────────────────────

describe('getBestPhotoUrl', () => {
  test('returns empty string for null', () => {
    expect(getBestPhotoUrl(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(getBestPhotoUrl(undefined)).toBe('');
  });

  test('returns last format from formats array', () => {
    const photo = { formats: ['small.jpg', 'medium.jpg', 'large.jpg'] };
    expect(getBestPhotoUrl(photo)).toBe('large.jpg');
  });

  test('returns first format if last is empty', () => {
    const photo = { formats: ['fallback.jpg', ''] };
    expect(getBestPhotoUrl(photo)).toBe('fallback.jpg');
  });

  test('returns seoLinkF when no formats', () => {
    const photo = { seoLinkF: 'full.jpg', seoLinkB: 'big.jpg' };
    expect(getBestPhotoUrl(photo)).toBe('full.jpg');
  });

  test('returns seoLinkB when seoLinkF is missing', () => {
    const photo = { seoLinkB: 'big.jpg', seoLinkM: 'med.jpg' };
    expect(getBestPhotoUrl(photo)).toBe('big.jpg');
  });

  test('returns seoLinkM when others are missing', () => {
    const photo = { seoLinkM: 'med.jpg' };
    expect(getBestPhotoUrl(photo)).toBe('med.jpg');
  });

  test('returns url as last fallback', () => {
    const photo = { url: 'direct.jpg' };
    expect(getBestPhotoUrl(photo)).toBe('direct.jpg');
  });

  test('returns empty string when photo has no relevant fields', () => {
    const photo = { irrelevant: true };
    expect(getBestPhotoUrl(photo)).toBe('');
  });

  test('prefers formats over seoLink fields', () => {
    const photo = { formats: ['fmt.jpg'], seoLinkF: 'seo.jpg' };
    expect(getBestPhotoUrl(photo)).toBe('fmt.jpg');
  });
});

// ─── addPhoto ────────────────────────────────────────────────────────────────

describe('addPhoto', () => {
  test('adds a new URL to the array', () => {
    const photos = ['a.jpg'];
    addPhoto(photos, 'b.jpg');
    expect(photos).toEqual(['a.jpg', 'b.jpg']);
  });

  test('does not add duplicate URL', () => {
    const photos = ['a.jpg', 'b.jpg'];
    addPhoto(photos, 'a.jpg');
    expect(photos).toEqual(['a.jpg', 'b.jpg']);
  });

  test('does not add empty string', () => {
    const photos = [];
    addPhoto(photos, '');
    expect(photos).toEqual([]);
  });

  test('does not add null', () => {
    const photos = [];
    addPhoto(photos, null);
    expect(photos).toEqual([]);
  });

  test('does not add undefined', () => {
    const photos = [];
    addPhoto(photos, undefined);
    expect(photos).toEqual([]);
  });

  test('adds to empty array', () => {
    const photos = [];
    addPhoto(photos, 'first.jpg');
    expect(photos).toEqual(['first.jpg']);
  });
});

// ─── descFilter ──────────────────────────────────────────────────────────────

describe('descFilter', () => {
  test('returns empty string for empty filter', () => {
    expect(descFilter({})).toBe('');
  });

  test('shows price range', () => {
    expect(descFilter({ priceFrom: '5000', priceTo: '10000' })).toBe('$5000–$10000');
  });

  test('shows price with only priceFrom', () => {
    expect(descFilter({ priceFrom: '3000', priceTo: '' })).toBe('$3000–$∞');
  });

  test('shows price with only priceTo', () => {
    expect(descFilter({ priceFrom: '', priceTo: '8000' })).toBe('$0–$8000');
  });

  test('shows year range', () => {
    expect(descFilter({ yearFrom: '2015', yearTo: '2020' })).toBe('2015–2020 р.');
  });

  test('shows year with only yearFrom', () => {
    expect(descFilter({ yearFrom: '2010', yearTo: '' })).toBe('2010–– р.');
  });

  test('shows fuel types', () => {
    expect(descFilter({ fuel: ['1', '2'] })).toBe('Бензин/Дизель');
  });

  test('shows gear types', () => {
    expect(descFilter({ gear: ['2'] })).toBe('Автомат');
  });

  test('combines multiple filter fields', () => {
    const f = {
      priceFrom: '5000', priceTo: '15000',
      yearFrom: '2018', yearTo: '2022',
      fuel: ['2'],
      gear: ['1'],
    };
    expect(descFilter(f)).toBe('$5000–$15000 · 2018–2022 р. · Дизель · Механіка');
  });

  test('handles unknown fuel value', () => {
    expect(descFilter({ fuel: ['99'] })).toBe('99');
  });

  test('handles unknown gear value', () => {
    expect(descFilter({ gear: ['5'] })).toBe('5');
  });

  test('shows all fuel types correctly', () => {
    expect(descFilter({ fuel: ['1', '2', '3', '4', '5'] })).toBe('Бензин/Дизель/Газ/Гібрид/Електро');
  });
});
