'use client';

import Icon from '@ant-design/icons';
import { Chatting01Icon } from '@houstonicons/react';
import { Dropdown } from 'antd';
import { useDeviceSize } from 'hooks';
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
    const { user } = useAppContext();
    const device = useDeviceSize();

    const tawkMessengerRef = useRef<TawkMessengerRefType | null>();

    const onTawkLoad = () => {
        const attributes: VisitorData = {};

        if (user?.name) {
            attributes.name = user.name;
        }

        if (user?.email) {
            attributes.email = user.email;
        }

        if (user?.uid) {
            attributes.id = user.uid;
        }

        if (!user?.name && !user?.email && !user?.uid) {
            return;
        }

        tawkMessengerRef.current?.setAttributes(attributes, (error) => {
            console.error('Error setting TawkTo attributes', error);
        });
    };

    if (mode === 'dropdown')
        return (
            <div>
                <Dropdown trigger={['click']} placement="bottomLeft" dropdownRender={() => chatIframe(device)}>
                    <Icon style={{ marginTop: '1.5rem' }} component={Chatting01Icon as ComponentType} />
                </Dropdown>
            </div>
        );

    return null;

    // return (
    //     <TawkMessengerReact
    //         onLoad={onTawkLoad}
    //         ref={tawkMessengerRef}
    //         propertyId={process.env.TAWK_TO_PROPERTY_ID}
    //         widgetId={process.env.TAWK_TO_WIDGET_ID}
    //     />
    // );
};
