'use client';

import { Col, Row } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { useRouter } from 'next/navigation';
import React from 'react';

export const DedaStarted: React.FC = () => {
    const router = useRouter();

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <ComingHpecs />
            </Col>
            <Col span={24}>
                <DedasGrid
                    type="lastDedas"
                    onSelectedDeda={(dedaId) => {
                        router.push(`/melp/deda/${dedaId}`);
                    }}
                />
            </Col>
        </Row>
    );
};
