'use client';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Col, Flex, Row, Typography } from 'antd';
import {
    HpecModulesList,
    HpecNavigationMobile,
    HpecResources,
    HpecSummary,
    HpecVideo,
    MaxWidthContainer,
} from 'components';
import { useGetHpecResources } from 'hooks';
import React, { useState } from 'react';

const { Title, Text } = Typography;

interface HpecMobileProps {
    params: Record<string, string>;
}

const Content = styled.div`
    width: 100%;
    min-height: 100%;
    background: var(--main-bg);
    position: relative;
    padding-top: 1rem;
    padding-bottom: 2rem;
`;

const LessonTabButton = styled.button`
    width: 100%;
    padding: 0.5rem;
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;
    background: rgba(183, 144, 96, 0.2);
    color: #fff;
    font-weight: 400;
    font-family: inherit;
    font-size: 1rem;
`;

const LessonView = ({ onChangeView, lessonId }: { onChangeView(): void; lessonId: string }) => {
    const [lessonTab, setLessonTab] = useState<'video' | 'summary' | 'resources'>('video');

    const { data } = useGetHpecResources(lessonId);

    const withoutResources = data?.singleLessonCollection?.items[0].lessonResourcesCollection.items.length === 0;

    const videoTab = () => (
        <Row gutter={[16, 24]}>
            <Col span={24}>
                <HpecVideo lessonId={lessonId} />
            </Col>
            <Col span={24}>
                <Row gutter={[16, 8]}>
                    <Col span={24}>
                        <LessonTabButton
                            onClick={() => {
                                setLessonTab('summary');
                            }}
                        >
                            Summary <RightOutlined />
                        </LessonTabButton>
                    </Col>
                    {!withoutResources && (
                        <Col span={24}>
                            <LessonTabButton
                                onClick={() => {
                                    setLessonTab('resources');
                                }}
                            >
                                Resources <RightOutlined />
                            </LessonTabButton>
                        </Col>
                    )}
                </Row>
            </Col>
        </Row>
    );

    const returnRow = (type: string) => (
        <Row gutter={[16, 8]}>
            <Col span={24}>
                <Flex justify="flex-end">
                    <Title level={5} className="color-white">
                        Title here
                    </Title>
                </Flex>
            </Col>
            <Col span={24}>
                <Flex justify="space-between">
                    <button
                        style={{ color: 'white', border: 'none', background: 'none' }}
                        onClick={() => {
                            setLessonTab('video');
                        }}
                        onFocus={() => {}}
                    >
                        <Text className="color-white">
                            <LeftOutlined style={{ marginRight: '0.5rem' }} />
                            Back
                        </Text>
                    </button>

                    <Text className="color-white">{type}</Text>
                </Flex>
            </Col>
        </Row>
    );

    const summaryTab = () => (
        <Flex vertical gap={16}>
            {returnRow('Summary')}
            <HpecSummary lessonId={lessonId} />
        </Flex>
    );

    const resourcesTab = () => (
        <Flex vertical gap={16}>
            {returnRow('Resources')}
            <HpecResources lessonId={lessonId} />
        </Flex>
    );

    return (
        <>
            <MaxWidthContainer>
                {lessonTab === 'video' && videoTab()}
                {lessonTab === 'summary' && summaryTab()}
                {lessonTab === 'resources' && resourcesTab()}
            </MaxWidthContainer>
            <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                <HpecNavigationMobile
                    onChangeView={() => {
                        onChangeView();
                        setLessonTab('video');
                    }}
                />
            </div>
        </>
    );
};

export const HpecMobile: React.FC<HpecMobileProps> = ({ params: { lessonId, hpecId } }) => {
    const [viewMode, setViewMode] = useState<'list' | 'lesson'>('lesson');

    const [hpecLessonId, setHpecLessonId] = useState<string>(lessonId);

    const onModuleFirstLesson = (firsLessonId: string) => {
        if (lessonId === 'first-lesson') {
            setHpecLessonId(firsLessonId);
        }
    };

    return (
        <Content>
            {viewMode === 'list' ? (
                <MaxWidthContainer>
                    <Flex vertical gap="1rem">
                        <Row gutter={[16, 6]}>
                            <Col span={24}>
                                <Title className="color-secondary">HPEC</Title>
                            </Col>
                            <Col span={24}>
                                <Text className="color-white">This is your personal coach. Go ahead!</Text>
                            </Col>
                        </Row>

                        <HpecModulesList
                            activeLessonId={hpecLessonId}
                            activeHpecId={hpecId}
                            onModuleFirstLesson={onModuleFirstLesson}
                        />
                    </Flex>
                </MaxWidthContainer>
            ) : (
                <LessonView
                    lessonId={hpecLessonId}
                    onChangeView={() => {
                        setViewMode('list');
                    }}
                />
            )}
        </Content>
    );
};
