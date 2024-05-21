'use client';

import { AppLayout } from 'components';
import { withAuthentication } from 'libs';
import React from 'react';

const Profile = () => {
    return (
        <AppLayout>
            <h1>Profile</h1>
        </AppLayout>
    );
};

export default withAuthentication(Profile);
