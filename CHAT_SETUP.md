# Настройка функционала чата и друзей

## Шаги для запуска

### 1. Выполните SQL скрипт на сервере

Подключитесь к серверу и выполните SQL скрипт:

```bash
ssh root@45.91.238.3
# Введите пароль: sGLTccA_Na#9zC

# Подключитесь к PostgreSQL
psql -U postgres -d space_point

# Выполните скрипт
\i /path/to/setup_database.sql
```

Или выполните SQL команды напрямую:

```sql
-- Создание таблицы друзей
CREATE TABLE IF NOT EXISTS friends (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    friend_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (user_id != friend_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON friends(user_id, status);

-- Триггер
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Запустите сервер

```bash
npm run server
```

### 3. Запустите фронтенд

```bash
npm run dev
```

## Новые функции

### Чат
- **Приватные чаты**: Автоматическое создание приватных чатов между пользователями
- **Групповые чаты**: Поддержка групповых чатов (можно расширить)
- **Сообщения**: Отправка и получение сообщений в реальном времени
- **История**: Загрузка истории сообщений

### Друзья
- **Поиск пользователей**: Поиск по имени и username
- **Запросы в друзья**: Отправка и принятие запросов
- **Управление друзьями**: Добавление и удаление из друзей
- **Статусы**: Отслеживание статуса дружбы

## API Endpoints

### Чат
- `GET /api/chat/users` - Получить всех пользователей
- `GET /api/chat/chats` - Получить чаты пользователя
- `GET /api/chat/private/:friendId` - Создать/получить приватный чат
- `GET /api/chat/:chatId/messages` - Получить сообщения чата
- `POST /api/chat/:chatId/messages` - Отправить сообщение

### Друзья
- `GET /api/friends` - Получить список друзей
- `GET /api/friends/search?query=` - Поиск пользователей
- `GET /api/friends/requests/incoming` - Входящие запросы
- `GET /api/friends/requests/outgoing` - Исходящие запросы
- `POST /api/friends/:friendId/request` - Отправить запрос в друзья
- `POST /api/friends/:friendId/accept` - Принять запрос
- `POST /api/friends/:friendId/reject` - Отклонить запрос
- `DELETE /api/friends/:friendId` - Удалить из друзей

## Аутентификация

Все API запросы требуют заголовок:
```
x-user-id: {user_id}
```

## Структура базы данных

### Таблица friends
- `id` - Уникальный идентификатор
- `user_id` - ID пользователя
- `friend_id` - ID друга
- `status` - Статус дружбы (pending, accepted, blocked)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

### Существующие таблицы
- `chats` - Чаты
- `chat_members` - Участники чатов
- `messages` - Сообщения
- `message_attachments` - Вложения сообщений
- `users` - Пользователи

## Тестирование

1. Зарегистрируйте несколько пользователей
2. Войдите под одним пользователем
3. Перейдите в раздел "Друзья"
4. Найдите другого пользователя и отправьте запрос в друзья
5. Войдите под вторым пользователем и примите запрос
6. Перейдите в чат и начните общение

## Возможные улучшения

1. **WebSocket** для реального времени
2. **Уведомления** о новых сообщениях
3. **Файлы** и медиа в сообщениях
4. **Групповые чаты** с администрированием
5. **Статусы** сообщений (отправлено, доставлено, прочитано)
6. **Поиск** по сообщениям
7. **Закрепление** важных сообщений
