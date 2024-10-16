'use client';

import Icon from '@ant-design/icons';
import { Chatting01Icon } from '@houstonicons/react';
import { Dropdown } from 'antd';
import { useDeviceSize } from 'hooks';
import { useRouter } from 'next/navigation';
import { useAppContext } from 'providers';
import React, { ComponentType, useRef } from 'react';

interface ChatProps {
    mode?: 'dropdown' | 'widget';
}

type VisitorData = { name?: string | null; email?: string | null; id?: string };

type TawkMessengerRefType = {
    setAttributes: (visitorData: VisitorData, errorHandler: (error: Error) => void) => void;
};

const chatIframe = (device: string) => {
    const style = {
        height: '600px',
        width: '450px',
        border: 'none',
        background: 'white',
        borderRadius: '0.5rem',
    };

    const mobileStyle = {
        width: '80vw',
        height: '90vh',
    };

    return (
        <iframe src="/help.html" allowTransparency style={device === 'mobile' ? { ...style, ...mobileStyle } : style} />
    );
};

export const Chat: React.FC<ChatProps> = ({ mode = 'widget' }) => {
    const router = useRouter();

    return (
        <div style={{ cursor: 'pointer' }} onClick={() => router.push('/settings?tab=help')}>
            <Icon style={{ marginTop: '1.5rem' }} component={Chatting01Icon as ComponentType} />
        </div>
    );
};
