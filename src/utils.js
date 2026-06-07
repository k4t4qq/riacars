/**
 * Pure utility functions extracted from the main app for testability.
 */

/**
 * Returns the first non-empty value from the given arguments.
 */
function firstValue(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== '');
}

/**
 * Formats race/mileage value into a readable string.
 */
function formatRace(value, raceInt) {
  const race = firstValue(value, raceInt);
  if (race === undefined) return '—';
  const text = String(race).trim();
  if (/км|km|тыс|тис/i.test(text)) return text;
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return text;
  return numeric < 1000 ? `${numeric} тис. км` : `${numeric.toLocaleString()} км`;
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

/**
 * Returns an appropriate API error message based on the error.
 */
function apiErrorText(error, label) {
  const message = String(error?.message || '');
  if (/ліміт|лимит|limit|HourOverlimit/i.test(message)) {
    return `Ліміт API для ${label}. Спробуй трохи пізніше.`;
  }
  return `Помилка завантаження ${label}`;
}

/**
 * Reads a cached array from localStorage.
 */
function readCache(key, storage) {
  try {
    const data = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch(e) {
    return [];
  }
}

/**
 * Writes a value to localStorage cache.
 */
function writeCache(key, value, storage) {
  try { storage.setItem(key, JSON.stringify(value)); } catch(e){}
}

/**
 * Gets the best quality photo URL from a photo object.
 */
function getBestPhotoUrl(photo) {
  if (!photo) return '';
  if (Array.isArray(photo.formats) && photo.formats.length) {
    return photo.formats[photo.formats.length - 1] || photo.formats[0];
  }
  return photo.seoLinkF || photo.seoLinkB || photo.seoLinkM || photo.url || '';
}

/**
 * Adds a photo URL to the array if it's not already present.
 */
function addPhoto(photos, url) {
  if (url && !photos.includes(url)) photos.push(url);
}

/**
 * Generates a human-readable description for a filter preset.
 */
function descFilter(f) {
  const parts = [];
  if (f.priceFrom || f.priceTo) parts.push(`$${f.priceFrom || 0}–$${f.priceTo || '∞'}`);
  if (f.yearFrom || f.yearTo) parts.push(`${f.yearFrom || '–'}–${f.yearTo || '–'} р.`);
  const FL = {1:'Бензин', 2:'Дизель', 3:'Газ', 4:'Гібрид', 5:'Електро'};
  const GL = {1:'Механіка', 2:'Автомат'};
  if (f.fuel?.length) parts.push(f.fuel.map(v => FL[v] || v).join('/'));
  if (f.gear?.length) parts.push(f.gear.map(v => GL[v] || v).join('/'));
  return parts.join(' · ');
}

module.exports = {
  firstValue,
  formatRace,
  escapeHTML,
  apiErrorText,
  readCache,
  writeCache,
  getBestPhotoUrl,
  addPhoto,
  descFilter,
};
