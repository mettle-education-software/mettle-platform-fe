'use client';

import TawkMessengerReact from '@tawk.to/tawk-messenger-react';
import { useAppContext } from 'providers';
import React, { useRef } from 'react';

export const Chat = () => {
    const { user } = useAppContext();

    type VisitorData = { name?: string | null; email?: string | null; id?: string };
    type TawkMessengerRefType = {
        setAttributes: (visitorData: VisitorData, errorHandler: (error: Error) => void) => void;
    };

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

    return (
        <TawkMessengerReact
            onLoad={onTawkLoad}
            ref={tawkMessengerRef}
            propertyId={process.env.TAWK_TO_PROPERTY_ID}
            widgetId={process.env.TAWK_TO_WIDGET_ID}
        />
    );
};
