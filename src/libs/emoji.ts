// Emojis do Mettle Chat: lista curta escolhida à mão (nativos do sistema, sem biblioteca nem download).
export const EMOJI_GROUPS: { id: string; icon: string; list: string[] }[] = [
    {
        id: 'smileys',
        icon: '😀',
        list: [
            ...'😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙😋😛😜🤪😝🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬😌😔😪🤤😴😷🤒🤕🤢🥵🥶🥴😵🤯🤠🥳😎🤓🧐😕😟🙁😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠',
        ],
    },
    {
        id: 'people',
        icon: '👍',
        list: [
            '👍',
            '👎',
            '👌',
            '✌️',
            '🤞',
            '🤟',
            '🤘',
            '🤙',
            '👈',
            '👉',
            '👆',
            '👇',
            '☝️',
            '✋',
            '🤚',
            '🖐️',
            '👋',
            '🤝',
            '🙏',
            '👏',
            '🙌',
            '👐',
            '🤲',
            '💪',
            '✍️',
            '🙋',
            '🙆',
            '🙅',
            '🤷',
            '🤦',
            '💁',
            '🙇',
            '👀',
            '🧠',
            '🗣️',
        ],
    },
    {
        id: 'hearts',
        icon: '❤️',
        list: [
            '❤️',
            '🧡',
            '💛',
            '💚',
            '💙',
            '💜',
            '🤎',
            '🖤',
            '🤍',
            '💔',
            '❣️',
            '💕',
            '💞',
            '💓',
            '💗',
            '💖',
            '💘',
            '💝',
        ],
    },
    {
        id: 'study',
        icon: '📚',
        list: [
            '📚',
            '📖',
            '📝',
            '✏️',
            '🖊️',
            '📌',
            '📎',
            '🎧',
            '🎤',
            '🎙️',
            '🔊',
            '📱',
            '💻',
            '⌚',
            '⏰',
            '⏳',
            '📅',
            '💡',
            '🔥',
            '⭐',
            '🌟',
            '✨',
            '🎯',
            '🏆',
            '🎉',
            '🎊',
            '✅',
            '❌',
            '❓',
            '❗',
            '💬',
        ],
    },
    {
        id: 'world',
        icon: '🌎',
        list: [
            '☕',
            '🍵',
            '🍕',
            '🍔',
            '🍎',
            '🍫',
            '🎂',
            '🌎',
            '🌍',
            '✈️',
            '🇧🇷',
            '🇺🇸',
            '🇬🇧',
            '🏠',
            '🌞',
            '🌙',
            '⛅',
            '🌧️',
            '🌈',
        ],
    },
];

const RECENT_KEY = 'mettleChatRecentEmoji';

export const readRecentEmoji = (): string[] => {
    try {
        const v = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
        return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 16) : [];
    } catch {
        return [];
    }
};

export const pushRecentEmoji = (e: string): string[] => {
    const next = [e, ...readRecentEmoji().filter((x) => x !== e)].slice(0, 16);
    try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        // modo privado: só nesta visita
    }
    return next;
};
