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
    }
}
export {};
