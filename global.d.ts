declare global {
    interface Window {
        confetti: (options: {
            particleCount?: number;
            spread?: number;
            startVelocity?: number;
            ticks?: number;
            origin?: {
                x?: number;
                y?: number;
            };
            colors?: string[];
            shapes?: string[];
            zIndex?: number;
            scalar?: number;
        }) => void;
        $chatwoot: {
            setUser: (
                uniqueIdentifier: string,
                user: {
                    email: string;
                    name: string;
                    avatar_url: string;
                },
            ) => void;
            toggle?: (state?: 'open' | 'close') => void;
            toggleBubbleVisibility?: (visibility: 'show' | 'hide') => void;
        };
        clarity?: (command: string, email: string, uuid: string) => void;
    }
}
export {};
