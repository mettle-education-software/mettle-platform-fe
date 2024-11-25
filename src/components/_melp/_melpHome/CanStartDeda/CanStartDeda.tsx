'use client';

import { Alert, Button, Col, Flex, Row, Skeleton, Typography, Modal, Select } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { useGetGoalByLevel, useStartDeda } from 'hooks';
import { DedaDifficulties, DedaDifficulty } from 'interfaces/melp';
import { nextMondayDate } from 'libs';
import { useRouter } from 'next/navigation';
import { useAppContext } from 'providers';
import React, { useState } from 'react';

const { Title, Text } = Typography;

export const CanStartDeda: React.FC = () => {
    const router = useRouter();
    const { isAppLoading } = useAppContext();

    const [isDifficultyConfirmationOpen, setIsDifficultyConfirmationOpen] = useState(false);
    const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState<DedaDifficulty>('MEDIUM');

    const { data: goalLevels, isLoading: goalsLoading } = useGetGoalByLevel(selectedDifficultyLevel);

    const confirmDedaStart = useStartDeda();

    const handleConfirmDedaStart = () => {
        confirmDedaStart.mutate(
            { userGoalLevel: selectedDifficultyLevel },
            {
                onSuccess: () => {
                    setIsDifficultyConfirmationOpen(false);
                },
            },
        );
    };

    return (
        <Skeleton loading={isAppLoading} active>
            <Modal
                maskClosable
                destroyOnClose
                title={
                    <Title level={5}>
                        Selecione o nível de dificuldade que você deseja configurar para começar o DEDA.
                    </Title>
                }
                open={isDifficultyConfirmationOpen}
                onOk={handleConfirmDedaStart}
                onCancel={() => setIsDifficultyConfirmationOpen(false)}
                okText={`Iniciar com ${DedaDifficulties[selectedDifficultyLevel]}`}
            >
                <Row gutter={24} style={{ paddingTop: '1.5rem', paddingBottom: '1rem' }}>
                    <Col span={12}>
                        <Row gutter={6}>
                            <Col span={24}>
                                <Text>Nível de dificuldade</Text>
                            </Col>
                            <Col span={24}>
                                <Select
                                    className="full-width"
                                    value={selectedDifficultyLevel}
                                    onChange={(value) => setSelectedDifficultyLevel(value)}
                                    options={Object.keys(DedaDifficulties).map((key) => ({
                                        label: DedaDifficulties[key as DedaDifficulty],
                                        value: key,
                                    }))}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <Row>
                            <Col span={24}>
                                <Skeleton paragraph active loading={goalsLoading}>
                                    <Text>
                                        Nesta dificuldade, você começará com uma meta de{' '}
                                        <strong>{goalLevels ? goalLevels[0]?.total : ''} (HH:MM) por dia</strong> e
                                        chegará a{' '}
                                        <strong>{goalLevels ? goalLevels[100]?.total : ''} (HH:MM) por dia</strong>
                                    </Text>
                                </Skeleton>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Modal>
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
                                    Hey there!
                                </Title>
                                <Button
                                    onClick={() => setIsDifficultyConfirmationOpen(true)}
                                    size="large"
                                    type="primary"
                                    loading={confirmDedaStart.isPending}
                                >
                                    Confirm DEDA start
                                </Button>
                            </Flex>
                        }
                        description={
                            <Text className="color-white">
                                You can start already the DEDA program. The next available date is{' '}
                                <strong>{nextMondayDate().toLocaleDateString()}</strong>
                            </Text>
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
                            router.push(`/imerso/deda/${dedaId}`);
                        }}
                    />
                </Col>
            </Row>
        </Skeleton>
    );
};
