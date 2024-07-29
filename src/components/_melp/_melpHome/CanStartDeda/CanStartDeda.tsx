'use client';

import { Col, Row, Typography, Alert, Button } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { nextMondayDate } from 'libs';
import { useRouter } from 'next/navigation';
import React from 'react';

const { Title, Text } = Typography;

export const CanStartDeda: React.FC = () => {
    const router = useRouter();

    const handleConfirmDedaStart = () => {};

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
                            Hey there!
                        </Title>
                    }
                    description={
                        <Text className="color-white">
                            You can start already the DEDA program. The next available date is{' '}
                            <strong>{nextMondayDate().toLocaleDateString()}</strong>
                        </Text>
                    }
                    action={
                        <Button onClick={handleConfirmDedaStart} size="large" type="primary">
                            Confirm DEDA start
                        </Button>
                    }
                />
            </Col>
            <Col span={24}>
                <ComingHpecs />
            </Col>
            <Col xs={24} md={18}>
                <DedasGrid
                    customTitle="DEDA week zero"
                    type="lastDedas"
                    onSelectedDeda={(dedaId) => {
                        router.push(`/melp/deda/${dedaId}`);
                    }}
                />
            </Col>
        </Row>
    );
};
