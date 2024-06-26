# Боткиссер

## Что это вообще такое?!
Боткиссер - Discord-бот со встроенной в него GPT нейросетью, которая обучена писать как можно более саркастические и грубые (иногда глупые) ответы на ваши вопросы.

## Содержание репозитория
1. Код для запуска Discord бота
2. Ipynb для обучения собственной модели
3. Скоро будет ещё и код для запуска Telegram версии бота

## Как запустить бота?
1. Если у вас ещё нету самого бота, вы должны создать одного на [Discord Developer Portal](https://discord.dev)
Обязательно надо включить в настройках бота все Privileged Gateway Intents!
2. Скопировать репозиторий либо бездумно скопировать весь код из файла index.js
3. С помощью NPM установить нужные библиотеки
```
npm install discord.js @huggingface/inference
```
4. Настроить бота:
  В начале вам надо изменить файл config.json.
Установите параметр hf_token на ваш [Huggingface](https://huggingface.co/) токен, а discord_token на токен от вашего Discord бота
```
{
  "hf_token": "Токен Huggingface",
  "discord_token": "Токен Discord"
}
```
5. После всех этих шагов, вы можете запустить бота!
```
node index.js
```

## "А мне не нравится как он себя ведёт!!"
С помощью trainer.ipynb вы можете обучить свою версию бота!
Для начала вам нужно будет подобрать нужный датасет, бот воспринимает такой формат данных:
```
<s>

[USR] (Кот ботинок) Привет [/USR]
[ANS] Привет [/ANS]
[USR] (Кот ботинок) Это экземпляр данных [/USR]
[ANS] Да [/ANS]

</s>

---

<s>

[USR] (Крот ботинок) Экземпляры можно разделять с помощью трёх тире [/USR]
[ANS] !!! Не используйте эти символы в самих диалогах !!! [/ANS]

</s>
```
1. Сообщения пользователя и бота обозначаются кошмарными HTML-подобными скобками,
`[USR] [/USR]` для пользователя и `[ANS] [/ANS]` для ответа нейросети
Минусом данной системы является то, что нейросеть попробует придумать ещё и то, что на это может ответить пользователь, но программа от этих данных избавляется
2. У `[USR] () [/USR]` в круглых скобках указывется имя пользователя. Сообщение пользователя стоит после этих круглых скобок.
3. С помощью ещё более кошмарных HTML-подобных `<s> </s>` скобок указываются начало и конец экземпляра
4. Также на всякий случай используются `---` для разделения экземпляров

Для запуска кода понадобится:
```
pip install torch transformers pandas
```

По умолчанию обучается модель `rugpt3medium_based_on_gpt2`. Для обучения модели можно использовать VSCode.
Перед обучением создайте папку `models` для хранения обученных моделей, ожидайте что модель будет весить ~1.32 гигабайта.

После обучения модели можно заменить URL модели по умолчанию на ваше новое произведение искус-с-с-с-ства!
1. Загрузите модель на Huggingface: лучше загрузить как приватную
2. В 5-ой строке файла index.js замените `https://api-inference.huggingface.co/models/Bootcat/bk-delta-psi` на `https://api-inference.huggingface.co/models/ВАША-НОВАЯ-МОДЕЛЬ`
3. Ваш новоиспечённый бот готов! Не ожидайте что он будет умнее GPT-4

## TODO?
Скоро тут будет исходный код Telegram-версии бота
