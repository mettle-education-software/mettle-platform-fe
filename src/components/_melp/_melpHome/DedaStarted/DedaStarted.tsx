'use client';

import { RightOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Col, Row, Typography } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { useRouter } from 'next/navigation';
import React from 'react';

const { Text } = Typography;

export const SeeRestBtn = styled.button`
    border: none;
    border-radius: 6px;
    background: linear-gradient(270deg, rgba(0, 0, 0, 0) 0%, #1f1f1f 83.45%);
    display: flex;
    align-items: center;
    height: 21rem;
    max-height: 21.5rem;
    width: 100%;
    padding-left: 1rem;
    cursor: pointer;
`;

export const DedaStarted: React.FC = () => {
    const router = useRouter();

    return (
        <Row gutter={[24, 24]}>
            <Col span={24}>
                <ComingHpecs />
            </Col>
            <Col span={24}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={18}>
                        <DedasGrid
                            type="lastDedas"
                            onSelectedDeda={(dedaId) => {
                                router.push(`/melp/deda/${dedaId}`);
                            }}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <SeeRestBtn
                            onClick={() => {
                                router.push('/melp/deda');
                            }}
                        >
                            <Text className="color-white">
                                See all DEDAs <RightOutlined style={{ marginLeft: '1rem' }} />
                            </Text>
                        </SeeRestBtn>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};
