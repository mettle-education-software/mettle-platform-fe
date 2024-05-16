'use client';

import { Flex, Result, Button, Typography } from 'antd';
import { AppLayout } from 'components';

export default function NotFound() {
    return (
        <AppLayout>
            <Flex
                justify="center"
                align="center"
                style={{ height: '100vh', width: '100%', background: 'var(--main-bg)' }}
            >
                <Result
                    status="404"
                    title={
                        <Typography.Title style={{ color: '#FFF' }} level={2}>
                            Ops!
                        </Typography.Title>
                    }
                    subTitle={
                        <Typography.Text style={{ color: '#FFF' }}>This page could not be found.</Typography.Text>
                    }
                    extra={
                        <Button type="primary" href="/">
                            Go back
                        </Button>
                    }
                />
            </Flex>
        </AppLayout>
    );
}
