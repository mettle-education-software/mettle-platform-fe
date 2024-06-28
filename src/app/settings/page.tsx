'use client';

import { AppLayout } from 'components';
import { withAuthentication } from 'libs';
import React from 'react';

const Settings = () => {
    return (
        <AppLayout>
            <h1>Settings</h1>
        </AppLayout>
    );
};

export default withAuthentication(Settings);
