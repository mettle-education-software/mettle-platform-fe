'use client';

import { useEffect, useState } from 'react';

export const useDeviceSize = () => {
    const [viewportState, setViewportState] = useState<'desktop' | 'mobile'>(
        typeof window !== 'undefined' && window?.innerWidth <= 360 ? 'mobile' : 'desktop',
    );

    useEffect(() => {
        window?.addEventListener('resize', () => {
            if (window.innerWidth <= 360) {
                setViewportState('mobile');
            } else {
                setViewportState('desktop');
            }
        });
    }, []);

    return viewportState;
};
