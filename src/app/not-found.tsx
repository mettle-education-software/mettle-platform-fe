'use client';

import styled from '@emotion/styled';
import { Flex, Result, Button, Typography } from 'antd';

const ErrorContainer = styled.div`
    height: 100vh;
    width: 100%;
    background: var(--main-bg);
`;

export default function NotFound() {
    return (
        <ErrorContainer>
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
        </ErrorContainer>
    );
}
