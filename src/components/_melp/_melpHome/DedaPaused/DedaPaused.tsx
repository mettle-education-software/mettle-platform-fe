'use client';

import { Alert, Button, Col, Row, Typography } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { nextMondayDate } from 'libs';
import { useRouter } from 'next/navigation';
import React from 'react';

const { Title, Text } = Typography;

export const DedaPaused: React.FC = () => {
    const handleDedaUnpause = () => {};

    const router = useRouter();

    return (
        <Row gutter={[24, 24]}>
            <Col span={24}>
                <Alert
                    style={{
                        background: 'var(--brown-bg)',
                        border: 'none',
                    }}
                    type="info"
                    showIcon
                    message={
                        <Title level={3} className="color-white">
                            Feel like getting back to DEDA?
                        </Title>
                    }
                    description={
                        <Text className="color-white">
                            You can return to the DEDA program. The next available date is{' '}
                            <strong>{nextMondayDate().toLocaleDateString()}</strong>
                        </Text>
                    }
                    action={
                        <Button onClick={handleDedaUnpause} size="large" type="primary">
                            Get back to DEDA
                        </Button>
                    }
                />
            </Col>
            <Col span={24}>
                <ComingHpecs />
            </Col>
            <Col xs={24} md={18}>
                <DedasGrid
                    type="lastDedas"
                    onSelectedDeda={(dedaId) => {
                        router.push(`/melp/deda/${dedaId}`);
                    }}
                />
            </Col>
        </Row>
    );
};
