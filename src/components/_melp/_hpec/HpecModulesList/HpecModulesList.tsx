'use client';

import styled from '@emotion/styled';
import { Collapse, CollapseProps, Flex, Progress, Skeleton, Typography } from 'antd';
import { useGetHpecsModules } from 'hooks/queries/hpecQueries';
import Link from 'next/link';
import { useMelpContext } from 'providers/MelpProvider';
import React, { useEffect, useState } from 'react';

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
    const { data, loading } = useGetHpecsModules();
    const [activeKey, setActiveKey] = useState(activeHpecId);

    if (loading || !melpSummary) return <Skeleton.Button active shape="round" block />;

    if (!data) return null;

    const { items: hpecList } = data.hpecContentCollection;

    const melpStatus = melpSummary.melp_status;
    const daysSinceMelpStart = melpSummary.days_since_melp_start;
    const currentDedaDay = melpSummary.current_deda_day;

    const items: CollapseProps['items'] = hpecList.map((hpec) => {
        let isLocked = false;

        if (['MELP_BEGIN', 'CAN_START_DEDA', 'DEDA_STARTED_NOT_BEGUN'].includes(melpStatus)) {
            if (daysSinceMelpStart < hpec.drippingDayBeforeDedaStart) {
                isLocked = true;
            }
            if (hpec.drippingDayAfterDedaStart) isLocked = true;
        }

        if (melpStatus === 'DEDA_STARTED') {
            if (currentDedaDay < hpec.drippingDayBeforeDedaStart) {
                isLocked = true;
            }
        }

        return {
            key: hpec.hpecId,
            label: hpec.hpecTitle,
            style: {
                background: '#3C362F',
                color: '#FFFFFF',
                borderBottom: '1px solid var(--secondary)',
            },
            collapsible: isLocked ? 'disabled' : 'header',
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

    return (
        <Flex vertical gap="2rem">
            <CompletedCard>
                <Flex align="center" justify="flex-start" gap="1rem">
                    <Progress
                        size={50}
                        type="circle"
                        percent={40}
                        strokeColor="var(--secondary)"
                        trailColor="#FFFFFF"
                    />
                    <Flex vertical gap="0.5rem">
                        <Title level={5} className="color-white">
                            HPEC Progress
                        </Title>
                        <Text className="color-white">xx of 32 classes completed</Text>
                    </Flex>
                </Flex>
            </CompletedCard>
            <StyledCollapse
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key as string)}
                style={{ border: 'none' }}
                expandIconPosition="end"
                items={items}
                accordion
            />
        </Flex>
    );
};
