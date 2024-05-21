'use client';

import { DownloadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Avatar, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { useGetHpecResources } from 'hooks/queries/hpecQueries';
import { fileTypes, saveFile } from 'libs';
import React from 'react';

const { Text, Title } = Typography;

interface HpecResourcesProps {
    lessonId: string;
}

const ResourceCard = ({
    className,
    title,
    fileType,
    fileSize,
    onClick,
}: {
    title: string;
    fileType: string;
    fileSize: number;
    className?: string;
    onClick?: () => void;
}) => {
    const parseFileSize = (size: number) => {
        if (size < 1024) {
            return `${size} B`;
        } else if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(2)} KB`;
        } else {
            return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        }
    };
    return (
        <div onClick={onClick} className={className}>
            <Flex justify="flex-start" align="center" gap="1rem">
                <Avatar size={40} className="avatar">
                    <DownloadOutlined className="icon" />
                </Avatar>

                <Flex vertical>
                    <Text className="file-title">{title}</Text>
                    <Flex>
                        <Text className="file-type">{fileTypes[fileType as keyof typeof fileTypes]}</Text> ∘{' '}
                        <Text className="file-size">{parseFileSize(fileSize)}</Text>
                    </Flex>
                </Flex>
            </Flex>
        </div>
    );
};

const StyleResourceCard = styled(ResourceCard)`
    padding: 1rem;
    border-radius: 10px;
    background: #353535;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
        background: #423e39;
    }

    &:hover .avatar {
        background: #353535;
    }

    .avatar {
        background: #423e39;
        transition: background 0.3s;
    }

    .icon {
        color: #f2f0ee;
    }

    .file-title {
        color: #f2d5b1;
    }

    .file-type {
        color: #f2f0ee;
    }

    .file-size {
        color: #877a6a;
    }
`;

export const HpecResources: React.FC<HpecResourcesProps> = ({ lessonId }) => {
    const { data, loading } = useGetHpecResources(lessonId);

    const filesList = data?.singleLessonCollection?.items[0].lessonResourcesCollection.items;

    if (loading || !filesList) return <Skeleton active loading />;

    return (
        <Row gutter={[22, 22]}>
            {filesList?.map((file) => (
                <Col key={file.url}>
                    <StyleResourceCard
                        onClick={() => {
                            saveFile(file.url, file.title, file.contentType as keyof typeof fileTypes);
                        }}
                        title={file.title}
                        fileType={file.contentType}
                        fileSize={file.size}
                    />
                </Col>
            ))}
        </Row>
    );
};
