// Карта страниц тиражного магазина MAISON.
// ВАЖНО: массив blocks — в порядке СНИЗУ ВВЕРХ,
// т.к. провижининг добавляет блоки в обратном порядке (первый элемент
// массива окажется внизу страницы).
// Коды без repo_ (штатные блоки Б24) добавляются напрямую через fields.CODE.
module.exports = [
  { code: 'home', title: 'Главная', blocks: ['vl-maison-footer', 'vl-maison-story', 'vl-maison-products', 'vl-maison-cats', 'vl-maison-hero', 'vl-maison-header'] },
  { code: 'catalog', title: 'Каталог', blocks: ['vl-maison-footer', 'store.catalog.list', 'vl-maison-header'] },
  { code: 'product-card', title: 'Карточка товара', blocks: ['vl-maison-footer', 'vl-maison-related', 'vl-maison-pcard', 'vl-maison-header'] },
  { code: 'new-arrivals', title: 'Новинки', blocks: ['vl-maison-footer', 'vl-maison-products', 'vl-maison-cats', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'about', title: 'О бренде', blocks: ['vl-maison-footer', 'vl-maison-craft', 'vl-maison-values', 'vl-maison-abstory', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'contacts', title: 'Контакты', blocks: ['vl-maison-footer', 'vl-maison-mapimg', '33.13.form_2_light_no_text', 'vl-maison-contacts', 'vl-maison-header'] },
  { code: 'delivery', title: 'Доставка', blocks: ['vl-maison-footer', 'vl-maison-delivery', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'returns', title: 'Возврат', blocks: ['vl-maison-footer', 'vl-maison-returns', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'faq', title: 'FAQ', blocks: ['vl-maison-footer', 'vl-maison-faq', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'privacy', title: 'Политика конфиденциальности', blocks: ['vl-maison-footer', 'vl-maison-article', 'vl-maison-header'] },
];
