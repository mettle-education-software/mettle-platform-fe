'use client';

import { Button, Typography } from 'antd';
import { handleLogout, withAuthentication } from 'libs';
import React from 'react';

function Home() {
    const handleSubmit = () => {
        handleLogout().catch((error) => {
            throw error;
        });
    };

    return (
        <main>
            <Typography.Title>Hello Mettle</Typography.Title>
            <Button
                type="primary"
                onClick={() => {
                    handleSubmit();
                }}
            >
                Sair
            </Button>
        </main>
    );
}

export default withAuthentication(Home);
