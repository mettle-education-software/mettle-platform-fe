'use client';

import styled from '@emotion/styled';
import { Col, Row } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { useRouter } from 'next/navigation';
import React from 'react';

const SeeRest = styled.button`
    height: 100%;
    widht: 100%;
    border: none;
    background: red;
`;

export const DedaStarted: React.FC = () => {
    const router = useRouter();

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <ComingHpecs />
            </Col>
            <Col span={24}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={18}>
                        <DedasGrid
                            type="lastDedas"
                            onSelectedDeda={(dedaId) => {
                                router.push(`/melp/deda/${dedaId}`);
                            }}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <SeeRest>See the rest</SeeRest>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};
