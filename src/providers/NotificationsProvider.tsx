'use client';

import { notification } from 'antd';
import React, { useContext, createContext } from 'react';

interface ContextProps {
    showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string, description: string) => void;
}

export const NotificationsContext = createContext<ContextProps>({} as ContextProps);

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
    notification.config({
        placement: 'topRight',
        top: 10,
        duration: 10,
        rtl: true,
    });

    const [api, contextHolder] = notification.useNotification();

    const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string, description: string) => {
        const colorsBy = {
            success: '#d4ffdb',
            error: '#ffd4d4',
            info: '#d4f2ff',
            warning: '#fffed4',
        };

        api[type]({
            message,
            description,
            style: {
                backgroundColor: colorsBy[type],
            },
        });
    };

    return (
        <NotificationsContext.Provider value={{ showNotification }}>
            {contextHolder}
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotificationsContext = () => useContext(NotificationsContext);
