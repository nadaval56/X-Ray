// גישה לתוכן. כל קובץ JSON ב-content/cases/ נאסף אוטומטית — הוספת מקרה לא דורשת שינוי קוד.
import categories from '../../content/categories.json';
import principles from '../../content/principles.json';
import materials from '../../content/materials.json';

const modules = import.meta.glob('../../content/cases/*.json', { eager: true, import: 'default' });

export const cases = Object.values(modules).sort(
  (a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title, 'he'),
);

export const getCase = (id) => cases.find((c) => c.id === id);
export const mainImage = (c) => c.images.find((im) => im.role === 'main');
export const imagesByRole = (c, role) => c.images.filter((im) => im.role === role);
export const imageUrl = (file) => `${import.meta.env.BASE_URL}images/cases/${file}`;
export const caseUrl = (id) => `./case.html?id=${encodeURIComponent(id)}`;

export { categories, principles, materials };
