'use client';

import { DownOutlined, LockOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Collapse, CollapseProps, Flex, Skeleton, Typography } from 'antd';
import { useGetCourseDetails } from 'hooks';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const { Title } = Typography;

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

interface CourseModulesListProps {
    courseSlug: string;
    activeLessonId: string;
    activeModuleId: string;
    onModuleFirstLesson: (firsLessonId: string) => void;
}

export const CourseModulesList: React.FC<CourseModulesListProps> = ({
    courseSlug,
    activeLessonId,
    activeModuleId,
    onModuleFirstLesson,
}) => {
    const { data: courseDetails, loading } = useGetCourseDetails(courseSlug);
    const modulesList = courseDetails?.courseCollection?.items[0].courseModulesCollection.items ?? [];

    const [activeKey, setActiveKey] = useState(activeModuleId);

    useEffect(() => {
        if (activeModuleId) {
            const activeModule = modulesList.find(({ moduleId }) => moduleId === activeModuleId);
            if (activeModule) {
                onModuleFirstLesson(activeModule.lessonsCollection.items[0].lessonId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modulesList, activeModuleId]);

    if (loading) return <Skeleton.Button active shape="round" block />;

    const unlockedItems: CollapseProps['items'] = modulesList.map((module) => {
        return {
            key: module.moduleId,
            label: module.moduleName,
            style: {
                background: '#3C362F',
                color: '#FFFFFF',
                borderBottom: '1px solid var(--secondary)',
            },
            collapsible: 'header',
            children: module.lessonsCollection.items.map((lesson) => {
                console.log('module lesson render', lesson);
                return (
                    <Link
                        key={lesson.lessonId}
                        href={'/course/[courseSlug]/[lessonId]'}
                        as={`/course/${courseSlug}/${lesson.lessonId}`}
                        shallow
                    >
                        <LessonLink className={lesson.lessonId === activeLessonId ? 'active' : ''}>
                            <Title level={5} className="color-white" style={{ fontWeight: 400 }}>
                                {lesson.lessonTitle}
                            </Title>
                        </LessonLink>
                    </Link>
                );
            }),
        };
    });

    const expandIcon: CollapseProps['expandIcon'] = ({ collapsible }) =>
        collapsible === 'disabled' ? <LockOutlined /> : <DownOutlined />;

    return (
        <Flex vertical gap="2rem">
            <StyledCollapse
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key as string)}
                style={{ border: 'none' }}
                expandIconPosition="end"
                items={unlockedItems}
                accordion
                expandIcon={expandIcon}
            />
        </Flex>
    );
};
