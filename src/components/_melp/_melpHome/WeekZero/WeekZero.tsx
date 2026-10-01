'use client';

import { Col, Row } from 'antd';
import { ComingHpecs, DedasGrid } from 'components';
import { dedaPath } from 'libs/cleanUrls';
import { useRouter } from 'next/navigation';
import React from 'react';

export const WeekZero: React.FC = () => {
    const router = useRouter();

    return (
        <Row gutter={[24, 24]}>
            <Col span={24}>
                <ComingHpecs />
            </Col>
            <Col xs={24} md={18}>
                <DedasGrid
                    customTitle="DEDA week zero"
                    type="lastDedas"
                    onSelectedDeda={(dedaSlug) => {
                        router.push(dedaPath(dedaSlug));
                    }}
                />
            </Col>
        </Row>
    );
};
