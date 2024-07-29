'use client';

import { Alert, Col, Row, Typography } from 'antd';
import { ComingHpecs } from 'components';
import { nextMondayDate } from 'libs';
import React from 'react';

const { Title, Text } = Typography;

export const WaitingForDedaStart: React.FC = () => {
    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Alert
                    style={{
                        background: 'var(--brown-bg)',
                        border: 'none',
                    }}
                    type="success"
                    showIcon
                    message={
                        <Title level={3} className="color-white">
                            Great!
                        </Title>
                    }
                    description={
                        <Text className="color-white">
                            You have confirmed the start of DEDA. Come back on{' '}
                            <strong>{nextMondayDate().toLocaleDateString()}</strong> to start.
                        </Text>
                    }
                />
            </Col>
            <Col span={24}>
                <ComingHpecs />
            </Col>
        </Row>
    );
};
