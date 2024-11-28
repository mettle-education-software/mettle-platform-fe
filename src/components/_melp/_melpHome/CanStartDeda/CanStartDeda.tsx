'use client';

import { Alert, Button, Col, Flex, Row, Skeleton, Typography, Modal, Select } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { useStartDeda } from 'hooks';
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

    const levelTexts: Record<DedaDifficulty, React.ReactNode> = {
        EASY: 'A gradual pace, reaching 3 hours/day (1 hour 15 minutes active, 1 hour 45 minutes passive) within 10 months (41 weeks).',
        MEDIUM: 'A moderate pace, reaching 4 hours/day (1 hour 30 minutes active, 2 hours 30 minutes passive) within 8 months (33 weeks).',
        HARD: 'An accelerated pace, reaching 5 hours/day (2 hours active, 3 hours passive) within 6 months (25 weeks).',
    };

    return (
        <Skeleton loading={isAppLoading} active>
            <Modal
                maskClosable
                destroyOnClose
                title={<Text>Choose your intensity level:</Text>}
                open={isDifficultyConfirmationOpen}
                onOk={handleConfirmDedaStart}
                okButtonProps={{
                    loading: confirmDedaStart.isPending,
                }}
                onCancel={() => setIsDifficultyConfirmationOpen(false)}
                okText={`Confirm ${DedaDifficulties[selectedDifficultyLevel]}`}
                cancelText="Cancel"
            >
                <Row gutter={[24, 24]} style={{ paddingTop: '1.5rem', paddingBottom: '1rem' }}>
                    <Col span={24}>
                        <Row gutter={6}>
                            <Col span={24}>
                                <Text>Intensity level options</Text>
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
                    <Col span={24}>
                        <Row>
                            <Col span={24}>
                                <Flex
                                    vertical
                                    gap="1rem"
                                    className="full-width"
                                    style={{ paddingLeft: 8, paddingRight: 8 }}
                                >
                                    <Text>
                                        The intensity level you select determines how quickly you’ll reach your daily
                                        targets and, ultimately, achieve your goal of English fluency:
                                    </Text>
                                    <Text style={{ backgroundColor: 'yellow' }}>
                                        <strong>{DedaDifficulties[selectedDifficultyLevel]}: </strong>
                                        {levelTexts[selectedDifficultyLevel as DedaDifficulty]}
                                    </Text>
                                    <Text>
                                        These targets help you structure your routine effectively, ensuring steady
                                        progress based on your commitment level.
                                    </Text>
                                    <Text>
                                        Note: You can only select your intensity level at the start of the program or
                                        when restarting it using one of your reset options.
                                    </Text>
                                </Flex>
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
