'use client';

import { Button, Typography } from 'antd';
import { AppLayout } from 'components';
import { handleLogout, withAuthentication } from 'libs';
import React from 'react';

function Home() {
    return (
        <AppLayout>
            <Typography>Dashboard here</Typography>
            <Button onClick={handleLogout}>Sair</Button>
        </AppLayout>
    );
}

export default withAuthentication(Home);
