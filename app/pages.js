// Карта страниц тиражного магазина MAISON.
// ВАЖНО: массив blocks — в порядке СНИЗУ ВВЕРХ,
// т.к. провижининг добавляет блоки в обратном порядке (первый элемент
// массива окажется внизу страницы).
// Коды без repo_ (штатные блоки Б24) добавляются напрямую через fields.CODE.
module.exports = [
  { code: 'home', title: 'Главная', blocks: ['vl-maison-footer', 'vl-maison-story', 'vl-maison-products', 'vl-maison-cats', 'vl-maison-hero', 'vl-maison-header'] },
  { code: 'katalog', title: 'Каталог', blocks: ['vl-maison-footer', 'vl-maison-catalogpage', 'vl-breadcrumbs', 'vl-maison-header'] },
  { code: 'product-card', title: 'Карточка товара', blocks: ['vl-maison-footer', 'vl-maison-related', 'vl-maison-pcard', 'vl-maison-header'] },
  { code: 'novinki', title: 'Новинки', blocks: ['vl-maison-footer', 'vl-maison-novpage', 'vl-breadcrumbs', 'vl-maison-header'] },
  { code: 'o-brende', title: 'О бренде', blocks: ['vl-maison-footer', 'vl-maison-craft', 'vl-maison-values', 'vl-maison-abstory', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'kontakty', title: 'Контакты', blocks: ['vl-maison-footer', 'vl-maison-mapimg', '33.13.form_2_light_no_text', 'vl-maison-contacts', 'vl-maison-header'] },
  { code: 'dostavka', title: 'Доставка', blocks: ['vl-maison-footer', 'vl-maison-delivery', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'vozvrat', title: 'Возврат', blocks: ['vl-maison-footer', 'vl-maison-returns', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'faq', title: 'FAQ', blocks: ['vl-maison-footer', 'vl-maison-faq', 'vl-maison-abhero', 'vl-maison-header'] },
  { code: 'privacy', title: 'Политика конфиденциальности', blocks: ['vl-maison-footer', 'vl-maison-article', 'vl-maison-header'] },
  { code: 'cart', title: 'Корзина', blocks: ['vl-maison-footer', 'vl-cart', 'vl-breadcrumbs', 'vl-maison-header'] },
  { code: 'checkout', title: 'Оформление заказа', blocks: ['vl-maison-footer', 'vl-checkout', 'vl-maison-header'] },
  { code: 'order-success', title: 'Заказ оформлен', blocks: ['vl-maison-footer', 'vl-order-success', 'vl-maison-header'] },
  { code: 'personal', title: 'Личный кабинет', blocks: ['vl-maison-footer', 'vl-account', 'vl-maison-header'] },
  { code: 'wishlist', title: 'Избранное', blocks: ['vl-maison-footer', 'vl-wishlist', 'vl-breadcrumbs', 'vl-maison-header'] },
  { code: 'addresses', title: 'Мои адреса', blocks: ['vl-maison-footer', 'vl-addresses', 'vl-maison-header'] },
  { code: 'auth', title: 'Вход и регистрация', blocks: ['vl-auth'] },
  { code: 'search', title: 'Поиск', blocks: ['vl-maison-footer', 'vl-search', 'vl-maison-header'] },
];
