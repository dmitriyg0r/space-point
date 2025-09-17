export const mockUsers = [
    {
        id: '1',
        name: 'Dmitry G0r',
        username: 'dmitry_gor', // добавил username
        avatar: 'https://i.pravatar.cc/150?img=1',
        lastMessage: 'Where are you?',
        timestamp: '20:31',
        unreadCount: 3, // число вместо строки
        isOnline: true, // boolean вместо строки
    },
    {
        id: '2', 
        name: 'Bragucha Kamen',
        username: 'bragucha_kamen',
        avatar: 'https://i.pravatar.cc/150?img=5',
        lastMessage: 'Сосал?',
        timestamp: '13:23',
        unreadCount: 0,
        isOnline: false,
    },
    {
        id: '3',
        name: 'Nissan',
        username: 'nissan_owner',
        avatar: 'https://i.pravatar.cc/150?img=7',
        lastMessage: 'Готов к завтрашнему запуску?',
        timestamp: '20:12',
        unreadCount: 3,
        isOnline: true,
    }
];

export const mockMessages = [
    {
        id: '1',
        user_id: '1', // ID Dmitry G0r
        message: 'Привет! Как дела?',
        timestamp: new Date().toISOString(),
        room: 'general'
    },
    {
        id: '2',
        user_id: '2', // ID Bragucha Kamen  
        message: 'Что планируешь на выходные?',
        timestamp: new Date().toISOString(),
        room: 'general'
    },
    {
        id: '3',
        user_id: '3', // ID Nissan
        message: 'Готов к завтрашнему запуску?',
        timestamp: new Date().toISOString(), 
        room: 'general'
    }
];