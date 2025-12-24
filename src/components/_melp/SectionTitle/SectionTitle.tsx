'use client';

import { Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => {
    return (
        <div>
            <Title style={{ color: 'var(--secondary)', fontWeight: 500 }} level={4}>
                {title}
            </Title>
            <Text style={{ color: '#FFF' }}>{subtitle}</Text>
        </div>
    );
};
