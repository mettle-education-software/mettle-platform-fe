'use client';

import { Col, Row } from 'antd';
import { ComingHpecs } from 'components';
import React from 'react';

export const MelpBegin: React.FC = () => {
    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <ComingHpecs />
            </Col>
        </Row>
    );
};
