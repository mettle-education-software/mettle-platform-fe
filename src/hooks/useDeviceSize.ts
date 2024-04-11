'use client';

import { useEffect, useState } from 'react';

export const useDeviceSize = () => {
    const [viewportState, setViewportState] = useState<'desktop' | 'mobile'>('desktop');

    useEffect(() => {
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 1024) {
                setViewportState('mobile');
            } else {
                setViewportState('desktop');
            }
        });
    }, []);

    return viewportState;
};
