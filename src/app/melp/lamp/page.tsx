'use client';

import { AppLayout, PageHeader } from 'components';
import { withAuthentication } from 'libs';
import React from 'react';

const LampPage: React.FC = () => {
    return (
        <AppLayout>
            <PageHeader />
            <h1>Lamp aqui</h1>
        </AppLayout>
    );
};

export default withAuthentication(LampPage);
