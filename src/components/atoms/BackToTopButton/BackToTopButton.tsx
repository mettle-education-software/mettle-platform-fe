'use client';

import { ArrowUpOutlined } from '@ant-design/icons';
import { FloatButton } from 'antd';
import React from 'react';

interface BackToTopButtonProps {
    scrollElementRef?: React.RefObject<HTMLElement>;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ scrollElementRef }) => {
    const handleBackToTopClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (scrollElementRef) {
            scrollElementRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const displayButton = scrollElementRef?.current?.scrollTop
        ? scrollElementRef.current.scrollTop > 0
        : window.scrollY > 0;

    // if (!displayButton) {
    //     return null;
    // }

    return (
        <>
            {JSON.stringify(
                scrollElementRef?.current
                    ? {
                          display: 'here',
                          offsetTop: scrollElementRef.current?.offsetTop,
                          scrollTop: scrollElementRef.current?.scrollTop,
                      }
                    : { display: 'none' },
            )}
            <FloatButton onClick={handleBackToTopClick} icon={<ArrowUpOutlined />} />
        </>
    );
};
