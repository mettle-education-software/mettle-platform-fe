'use client';

import { SMALL_VIEWPORT } from 'libs';
import { useEffect, useState } from 'react';

export const useDeviceSize = () => {
    const [viewportState, setViewportState] = useState<'desktop' | 'mobile'>(
        typeof window !== 'undefined' && window?.innerWidth <= SMALL_VIEWPORT ? 'mobile' : 'desktop',
    );

    useEffect(() => {
        window?.addEventListener('resize', () => {
            if (window.innerWidth <= SMALL_VIEWPORT) {
                setViewportState('mobile');
            } else {
                setViewportState('desktop');
            }
        });
    }, []);

    return viewportState;
};
