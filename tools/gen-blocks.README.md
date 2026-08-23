Генератор блоков тиражного приложения MAISON.
Источник: проверенные payload из %TEMP%/opencode/register-*.json
(ровно те, что зарегистрированы и работают на живом сайте velvet).
Действия:
1) переписывает CDN: velvet-marketplace-app@<любой тег> -> maison-marketplace-app@v0.1
2) сохраняет в app/blocks/<code>.json
3) собирает список упомянутых ассетов и копирует их из velour assets в app/assets
Запуск: node tools/gen-blocks.js
