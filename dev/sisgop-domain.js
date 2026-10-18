import {students} from './sisgop-students.js';

export const courses = ['1A','1B','1C','2A','2B','2C','3A','3B','4A','4B','5A','5B','5C','6A','6B','6C'];
export function normalizeName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}
export function studentMatches(course, value, roster = students) {
  const words = normalizeName(value).split(' ').filter(Boolean);
  return roster.filter(student => student.course === course && words.every(word => normalizeName(student.name).includes(word)));
}
export function recognizeStudent(course, value, roster = students) {
  if (!normalizeName(value)) return null;
  const candidates = studentMatches(course, value, roster);
  return candidates.find(student => normalizeName(student.name) === normalizeName(value)) || (candidates.length === 1 ? candidates[0] : null);
}
// Mantiene exactamente el identificador utilizado por las cuentas Firebase existentes.
export function authIdentifier(course, name) {
  const key = `${course.toLowerCase()}_${normalizeName(name).replace(/[^a-z0-9 ]/g, '').replace(/ /g, '-')}`;
  if (!/^[a-z0-9]{1,3}_[a-z0-9-]{3,100}$/.test(key)) throw new Error('Verifica el curso y el nombre completo.');
  return key + '@cuentas.sisgop.invalid';
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function eventDate(item) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.fechaEvento || '')) return item.fechaEvento.split('-').reverse().join('/');
  return registrationDate(item);
}
export function registrationDate(item) {
  return item.creado?.toDate?.().toLocaleDateString('es-BO') || '—';
}
function createdMillis(item) {
  if (typeof item.creado?.toMillis === 'function') return item.creado.toMillis();
  if (typeof item.creado?.seconds === 'number') return item.creado.seconds * 1000 + (item.creado.nanoseconds || 0) / 1e6;
  return 0;
}
export function newestFirst(items) {
  return [...items].sort((a,b) => createdMillis(b)-createdMillis(a) || String(b.id).localeCompare(String(a.id)));
}
export function filterObjects(items, text, status) {
  const needle = normalizeName(text);
  return items.filter(item => (status === 'Todos' || item.estado === status) &&
    normalizeName([item.nombre,item.lugar,item.categoria,item.descripcion,item.curso,item.registranteNombre].join(' ')).includes(needle));
}
