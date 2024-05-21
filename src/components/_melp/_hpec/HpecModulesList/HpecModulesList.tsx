'use client';

import styled from '@emotion/styled';
import { Collapse, CollapseProps, Flex, Progress, Skeleton, Typography } from 'antd';
import { useGetHpecsModules } from 'hooks/queries/hpecQueries';
import Link from 'next/link';
import { useMelpContext } from 'providers/MelpProvider';
import React, { useState } from 'react';

const { Title, Text } = Typography;

const StyledCollapse = styled(Collapse)`
    .ant-collapse-item:first-child {
        border-top-left-radius: 6px !important;
        border-top-right-radius: 6px !important;
    }

    & * {
        color: white !important;
    }
`;

const LessonLink = styled.div`
    width: 100%;
    padding: 1rem;
    background: #2b2b2b;
    cursor: pointer;
    transition: background 300ms ease;

    &:hover {
        background: #3c362f;
    }

    &.active {
        background: #544c42;
    }
`;

const CompletedCard = styled.div`
    width: 100%;
    padding: 1rem;
    background: #3c362f;
    color: #fff;
    border-radius: 6px;
`;

interface HpecModulesListProps {
    activeLessonId: string;
    activeHpecId: string;
}

export const HpecModulesList: React.FC<HpecModulesListProps> = ({ activeLessonId, activeHpecId }) => {
    const { melpSummary } = useMelpContext();
    const { unlockedModules, lockedModules, unlockedLessons, totalLessons, progressCount, loading } =
        useGetHpecsModules();
    const [activeKey, setActiveKey] = useState(activeHpecId);

    if (loading || !melpSummary) return <Skeleton.Button active shape="round" block />;

    const unlockedItems: CollapseProps['items'] = unlockedModules.map((hpec) => {
        return {
            key: hpec.hpecId,
            label: hpec.hpecTitle,
            style: {
                background: '#3C362F',
                color: '#FFFFFF',
                borderBottom: '1px solid var(--secondary)',
            },
            collapsible: 'header',
            children: hpec.hpecLessonsCollection.items.map((lesson) => (
                <Link
                    key={lesson.lessonId}
                    href={'/melp/hpec/[hpecId]/[lessonId]'}
                    as={`/melp/hpec/${hpec.hpecId}/${lesson.lessonId}`}
                    shallow
                >
                    <LessonLink className={lesson.lessonId === activeLessonId ? 'active' : ''}>
                        <Title level={5} className="color-white" style={{ fontWeight: 400 }}>
                            {lesson.lessonTitle}
                        </Title>
                    </LessonLink>
                </Link>
            )),
        };
    });

    const lockedItems: CollapseProps['items'] = lockedModules.map((hpec) => {
        return {
            key: hpec.hpecId,
            label: hpec.hpecTitle,
            style: {
                background: '#3C362F',
                color: '#FFFFFF',
                borderBottom: '1px solid var(--secondary)',
            },
            collapsible: 'disabled',
        };
    });

    return (
        <Flex vertical gap="2rem">
            <CompletedCard>
                <Flex align="center" justify="flex-start" gap="1rem">
                    <Progress
                        size={50}
                        type="circle"
                        percent={progressCount}
                        strokeColor="var(--secondary)"
                        trailColor="#FFFFFF"
                    />
                    <Flex vertical gap="0.5rem">
                        <Title level={5} className="color-white">
                            HPEC Progress
                        </Title>
                        <Text className="color-white">
                            {unlockedLessons} of {totalLessons} classes unlocked
                        </Text>
                    </Flex>
                </Flex>
            </CompletedCard>
            <StyledCollapse
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key as string)}
                style={{ border: 'none' }}
                expandIconPosition="end"
                items={unlockedItems.concat(lockedItems)}
                accordion
            />
        </Flex>
    );
};
