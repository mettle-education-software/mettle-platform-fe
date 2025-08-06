'use client';

import { RightOutlined, TrophyFilled } from '@ant-design/icons';
import { Alert, Col, Row, Typography } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { useRouter } from 'next/navigation';
import React from 'react';
import { SeeRestBtn } from '../DedaStarted/DedaStarted';

const { Text, Title } = Typography;

export const DedaFinished: React.FC = () => {
    const router = useRouter();

    return (
        <Row gutter={[24, 24]}>
            <Col span={24}>
                <Alert
                    style={{
                        background: 'var(--brown-bg)',
                        border: 'none',
                    }}
                    type="success"
                    showIcon
                    icon={<TrophyFilled />}
                    message={
                        <Title level={3} className="color-white">
                            Well done!
                        </Title>
                    }
                    description={<Text className="color-white">You have completed all DEDA weeks!</Text>}
                />
            </Col>
            <Col span={24}>
                <ComingHpecs />
            </Col>
            <Col span={24}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={18}>
                        <DedasGrid
                            customTitle="Dive back again"
                            type="lastDedas"
                            onSelectedDeda={(dedaId) => {
                                router.push(`/imerso/deda/${dedaId}`);
                            }}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <SeeRestBtn
                            onClick={() => {
                                router.push('/imerso/deda');
                            }}
                        >
                            <Text className="color-white">
                                Explore all DEDAs <RightOutlined style={{ marginLeft: '1rem' }} />
                            </Text>
                        </SeeRestBtn>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};
