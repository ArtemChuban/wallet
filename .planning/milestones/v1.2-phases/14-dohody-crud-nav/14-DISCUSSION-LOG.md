# Phase 14: Доходы CRUD + nav - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 14-Доходы CRUD + nav
**Areas discussed:** Раскладка списка, Создание, Глубина страницы, Порядок в nav

---

## Раскладка списка

| Option | Description | Selected |
|--------|-------------|----------|
| По людям | Группы Person, внутри доходы (как Долги) | ✓ |
| По типу | Секции Регулярные / Разовые | |
| Плоский список | Все источники подряд | |
| Ты реши | Claude discretion | |

**User's choice:** По людям
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Сначала регулярные | Тип важнее даты | |
| По ближайшей плановой дате | Одна лента | ✓ |
| Алфавит/создание | Без сортировки по дате | |
| Ты реши | | |

**User's choice:** По ближайшей плановой дате

| Option | Description | Selected |
|--------|-------------|----------|
| Все люди | Пустые группы + CTA | ✓ |
| Только с доходами | | |
| С доходами + кнопка добавить человека | | |
| Ты реши | | |

**User's choice:** Все люди

| Option | Description | Selected |
|--------|-------------|----------|
| Тип + сумма + валюта + плановая дата | | ✓ |
| То же + заметка | | |
| Минимум сумма + дата | | |
| Ты реши | | |

**User's choice:** Тип + сумма + валюта + плановая дата

---

## Создание

| Option | Description | Selected |
|--------|-------------|----------|
| Две кнопки | Регулярный / Разовый | |
| Одна + переключатель типа | | ✓ |
| Как Долги (одна кнопка, тип полем) | | |
| Ты реши | | |

**User's choice:** Одна кнопка + переключатель

| Option | Description | Selected |
|--------|-------------|----------|
| Person предзаполнен | Можно сменить | ✓ |
| Person пустой | | |
| Person зафиксирован | | |
| Ты реши | | |

**User's choice:** Предзаполнен, можно сменить

| Option | Description | Selected |
|--------|-------------|----------|
| existing/new Person | Как Долги | ✓ |
| Только existing | | |
| Ты реши | | |

**User's choice:** existing/new

| Option | Description | Selected |
|--------|-------------|----------|
| Регулярный + primary | | ✓ |
| Регулярный + пустая валюта | | |
| Последний тип + primary | | |
| Ты реши | | |

**User's choice:** Регулярный + primary

---

## Глубина страницы

| Option | Description | Selected |
|--------|-------------|----------|
| Только шаблоны | | |
| Шаблоны + слоты | | |
| Слоты как основная лента | | |
| Ты реши | Claude: определения + next planned date | ✓ |

**User's choice:** Ты реши → Claude: definitions + next planned date; no multi-slot feed; no fill-actual

| Option | Description | Selected |
|--------|-------------|----------|
| Только ≥ сегодня | | |
| Включая просроченный план без «заполни» | | ✓ |
| Ты реши | | |

**User's choice:** Включая просроченный без стиля «заполни»

| Option | Description | Selected |
|--------|-------------|----------|
| Текст в шапке | Не меняет баланс | ✓ |
| Только в диалоге | | |
| И там и там | | |
| Нигде | | |

**User's choice:** Шапка

| Option | Description | Selected |
|--------|-------------|----------|
| Кнопка «Изменить» | | ✓ |
| Клик по строке = edit | | |
| Клик = детали, Изменить отдельно | | |
| Ты реши | | |

**User's choice:** Кнопка «Изменить»

---

## Порядок в nav

| Option | Description | Selected |
|--------|-------------|----------|
| После Долгов | | |
| После Счетов | Главная · Счета · Доходы · Долги · Валюты | ✓ |
| В конце | | |
| Ты реши | | |

**User's choice:** После Счетов

| Option | Description | Selected |
|--------|-------------|----------|
| `/income` | | ✓ |
| `/dohody` | | |
| `/incomes` | | |
| Ты реши | | |

**User's choice:** `/income`

| Option | Description | Selected |
|--------|-------------|----------|
| Новый человек + Новый доход | | ✓ |
| Только Новый доход | | |
| Ты реши | | |

**User's choice:** Оба CTA

| Option | Description | Selected |
|--------|-------------|----------|
| Удаление человека с Доходов + Restrict | | ✓ |
| Только с Долгов | | |
| Ты реши | | |

**User's choice:** Да, с Restrict

---

## Claude's Discretion

- Page content depth (definitions + computed next planned date vs multi-slot list)

## Deferred Ideas

- Phase 15–17 features (actual/overdue, stats, forecast)
- Future Requirements (pause/end, nav badge, etc.)
