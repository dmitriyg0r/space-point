-- Выполните этот скрипт на вашем сервере PostgreSQL
-- Подключение: ssh root@45.91.238.3

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

-- Индексы для таблицы friends
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON friends(user_id, status);

-- Триггер для таблицы friends
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Проверка существования таблиц
SELECT 'Таблица friends создана успешно' as status;
SELECT COUNT(*) as friends_count FROM friends;

-- Read receipts (минимальная реализация)
ALTER TABLE chat_members
  ADD COLUMN IF NOT EXISTS last_read_message_id BIGINT,
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
