'use client';

import styled from '@emotion/styled';
import { ConfigProvider, Select as AntSelect, SelectProps, Skeleton } from 'antd';
import { useGetDedasList } from 'hooks';
import React from 'react';

const Select = styled(AntSelect)``;

export const DedasListSelect: React.FC<SelectProps> = (props) => {
    const { dedasList, isLoading: isDedasListLoading } = useGetDedasList();

    return isDedasListLoading ? (
        <Skeleton active loading />
    ) : (
        <ConfigProvider
            theme={{
                components: {
                    Select: {
                        clearBg: 'transparent',
                        selectorBg: 'transparent',
                        colorTextPlaceholder: 'var(--secondary)',
                        colorBorder: 'var(--secondary)',
                        colorText: 'var(--secondary)',
                    },
                },
            }}
        >
            <Select
                {...props}
                size="large"
                style={{ width: 300 }}
                placeholder="Select DEDA week"
                options={dedasList.map(({ id, title }) => ({
                    value: id,
                    label: title,
                }))}
            />
        </ConfigProvider>
    );
};
