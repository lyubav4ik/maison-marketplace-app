# Статус приложения MAISON

Status: задеплоено, ждёт регистрации в кабинете партнёра
Версия: 1.0.0
Бренд: MAISON

## Продакшен (VibeCode Galaxy)
- appUrl: https://app-81b3fc11f662.vibecode.bitrix24.tech
- serverId: 07994a85-863b-4966-b1fb-40a08b722f3e (kind GALAXY_APP)
- accessPolicy PUBLIC, автосон управляется на уровне галактики
- env: APP_URL=https://app-81b3fc11f662.vibecode.bitrix24.tech,
  NODE_ENV=production; MAISON_CLIENT_ID/SECRET придут из кабинета партнёра
- Смоук пройден: /status, /install, /assets/maison-logo.svg, / (MAISON) — 200

## Что работает
- 18 премиум-блоков `vl-maison-*` — те же определения, что живут на
  рабочем сайте velvet (проверены e2e: рендер, FAQ-аккордеон, галерея).
- Сервер установки `app/server.js` v1.0.0 (порт с проверенного velour
  v0.5.3): OAuth code-exchange, мастер установки, фоновый провижининг,
  повторная установка, uninstall, реестр установок в data/installs.json.
- Провижининг: регистрация блоков → сайт STORE «MAISON» (код maison,
  при занятости — суффикс) → каталог 6 разделов + 30 товаров + SKU →
  10 страниц из pages.js → главная → публикация (лимит тарифа обработан).
- Штатные блоки добавляются кодом напрямую: 33.13.form_2_light_no_text,
  store.catalog.list (fallback-логика из deploy-v3).
- Ассеты через jsDelivr `@v0.1` репозитория maison-marketplace-app —
  стили не зависят от сервера приложения.

## Что нет / отложено
- Фото демо-товаров: товары создаются без картинок. Спайк прикрепления
  (DETAIL_PICTURE через REST) запланирован на тест-установку.
- Мультиязычность, платная монетизация — после первой публикации.

## Чего не хватает для Маркетплейса
1. Регистрация приложения в кабинете партнёра:
   - Обработчик: https://app-81b3fc11f662.vibecode.bitrix24.tech/install
   - Ссылка на приложение: https://app-81b3fc11f662.vibecode.bitrix24.tech/app
   - Права: landing, catalog, sale, user_brief
   → client_id/secret в env сервера (редеплой) или app/config.json
2. Тест-установка на чистом портале (полный цикл + reinstall).

## Грабли, которые уже учтены
- Санитайзер Б24 режет form/input/textarea в CONTENT блоков — форма
  контактов сделана штатным блоком Б24.
- addblock требует {lid, fields:{CODE}} в нижнем регистре.
- Повторы jsDelivr-префикса в старых payload — чинится tools/fix-cdn.js.
- VibeCode Galaxy: accessPolicy отдельным PATCH, ждать running+CONNECTED,
  subdomain брать из ответа API.
