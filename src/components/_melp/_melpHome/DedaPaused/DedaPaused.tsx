'use client';

import { Alert, Button, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { useResumeDeda } from 'hooks';
import { nextMondayDate } from 'libs';
import { useRouter } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

const { Title, Text } = Typography;

export const DedaPaused: React.FC = () => {
    const router = useRouter();
    const { isAppLoading } = useAppContext();

    const resumeDeda = useResumeDeda();

    const handleDedaResume = () => {
        resumeDeda.mutate();
    };

    return (
        <Skeleton loading={isAppLoading} active>
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
                            <Flex wrap justify="space-between" gap="1rem">
                                <Title level={3} className="color-white">
                                    Feel like getting back to DEDA?
                                </Title>
                                <Button
                                    onClick={handleDedaResume}
                                    loading={resumeDeda.isPending}
                                    size="large"
                                    type="primary"
                                >
                                    Return to DEDA
                                </Button>
                            </Flex>
                        }
                        description={
                            <Text className="color-white">
                                You can return to the DEDA program. The next available date is{' '}
                                <strong>{nextMondayDate().toLocaleDateString()}</strong>
                            </Text>
                        }
                        banner
                    />
                </Col>
                <Col span={24}>
                    <ComingHpecs />
                </Col>
                <Col xs={24} md={18}>
                    <DedasGrid
                        type="lastDedas"
                        onSelectedDeda={(dedaId) => {
                            router.push(`/imerso/deda/${dedaId}`);
                        }}
                    />
                </Col>
            </Row>
        </Skeleton>
    );
};
