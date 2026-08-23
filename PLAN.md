# План: MAISON как тиражное приложение Маркетплейс

Статус: в работе. Не показывать пользователю, служебный файл.

## Цель
Приложение «MAISON» в Маркетплейсе Б24: при установке на любой портал
автоматически создаёт готовый интернет-магазин женской одежды:
сайт-витрина (тип STORE) + премиум-блоки конструктора + демо-каталог.

## Архитектура (наследие velvet → velour → maison)
- Блоки: 18 премиум-определений `vl-maison-*` (источник — проверенные
  payload из %TEMP%/opencode/register-*.json, они же зарегистрированы
  и работают на живом сайте velvet).
- Ассеты (css/js/jpg): в репо `lyubav4ik/maison-marketplace-app`, раздаются
  через jsDelivr CDN `@v0.1` — стили не зависят от доступности сервера.
- Сервер (app/server.js, порт с velour v0.5.3): OAuth-установка,
  провижининг (регистрация блоков → сайт STORE → каталог 6 разделов +
  30 товаров + SKU → страницы → публикация), uninstall, реестр установок.
- Конфиги только через env/config.json (в .gitignore).

## Отличия от velour-сервера
1. Ребрендинг VELOUR→MAISON везде (имя, тексты мастера установки,
   TITLE/CODE сайта `maison`, палитра страниц — чёрный/белый люкс).
2. APP_URL из env (домен Galaxy станет новым).
3. addblock: fallback на штатные коды (33.13.form_2_light_no_text,
   store.catalog.list) — порт фикса из deploy-v3.
4. pages.js: финальная карта 10 страниц (низ-вверх массивы):
   home, product-card, about, new-arrivals, contacts(+форма),
   delivery, returns, faq, privacy(article), catalog(native store).
   Корзина/оформление/кабинет — встроенные механизмы магазина Б24.
5. Защита от повторной установки: если CODE `maison` занят — суффикс.
6. Версия 1.0.0, имя maison.

## Шаги
- [x] Изучить правила, бэкап в _backups
- [x] Определить источник блоков (temp payload, 18 шт)
- [ ] Генератор blocks/*.json + сбор ассетов (tools/gen-blocks.js)
- [ ] pages.js, server.js, конфиги
- [ ] Чистка: удалить блоки/ (клон velvet), src/, старый app/server.js
- [ ] git init, коммит, GitHub-репо, push, тег v0.1
- [ ] SESSION.md/README, отчёт «готово к деплою» + чек-лист партнёра

## После деплоя (по команде пользователя)
- Создать сервер Galaxy (PUBLIC, автосон 15 мин), задеплоить, APP_URL в env.
- Тест-установка на чистом портале (Фаза C): полный цикл install→проверка→
  uninstall→reinstall; спайк картинки товаров (DETAIL_PICTURE через REST).
- Регистрация в кабинете партнёра (данные дам), листинг, модерация.

## Грабли (из ERRORS.md/WORKLOG)
- {success,data} обёртка VibeCode API; accessPolicy отдельным PATCH;
  ждать running+CONNECTED; subdomain брать из ответа API.
- Санитайзер Б24 режет form/input/textarea/script в CONTENT блоков.
- landing.landing.addblock: {lid, fields:{CODE}} в нижнем регистре;
  метода markdeleted нет; getlist с params.edit_mode Y даёт {id,code}.
