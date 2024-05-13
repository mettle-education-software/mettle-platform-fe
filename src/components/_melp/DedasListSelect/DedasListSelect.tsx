'use client';

import styled from '@emotion/styled';
import { ConfigProvider, Select as AntSelect, SelectProps, Skeleton } from 'antd';
import { useGetDedasList } from 'hooks';
import React from 'react';

const Select = styled(AntSelect)`
    position: relative;
    z-index: 1;

    &.ant-select {
        .ant-select-arrow {
            color: var(--secondary) !important;
        }

        .ant-select-clear {
            color: var(--secondary) !important;
        }

        .ant-select-item-option-selected {
            background-color: #ffffff !important;
        }
    }

    &::before {
        content: 'DEDA';
        position: absolute;
        font-size: 13px;
        background: #3c362f;
        z-index: 3;
        padding: 0 8px;
        top: -8px;
        left: 17px;
    }
`;

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
            <div style={{ padding: '1rem 0' }}>
                <Select
                    {...props}
                    size="large"
                    style={{ width: 300 }}
                    placeholder="Select DEDA week"
                    options={dedasList}
                />
            </div>
        </ConfigProvider>
    );
};
