'use client';

import styled from '@emotion/styled';
import { ConfigProvider, Select as AntSelect, SelectProps, Skeleton } from 'antd';
import React from 'react';

const SelectStyled = styled(AntSelect)<{ label?: string }>`
    position: relative;
    z-index: 0;

    &.ant-select {
        .ant-select-arrow {
            color: #888 !important;
        }

        .ant-select-clear {
            color: var(--secondary) !important;
        }

        .ant-select-item-option-selected {
            background-color: #ffffff !important;
        }
    }

    &::before {
        content: ${(props) => `'${props.label ?? ''}'`};
        position: absolute;
        font-size: 13px;
        background: #3c362f;
        color: #888;
        z-index: 1;
        padding: 0 8px;
        top: -8px;
        left: 17px;
    }
`;

export const Select: React.FC<SelectProps & { label?: string }> = ({ loading, label, ...props }) => {
    return loading ? (
        <Skeleton active loading />
    ) : (
        <ConfigProvider
            theme={{
                components: {
                    Select: {
                        clearBg: 'transparent',
                        selectorBg: 'transparent',
                        colorTextPlaceholder: 'var(--secondary)',
                        colorBorder: '#888',
                        colorText: '#888',
                    },
                },
            }}
        >
            <div style={{ padding: '1rem 0' }}>
                <SelectStyled {...props} size="large" style={{ width: 300 }} label={label} />
            </div>
        </ConfigProvider>
    );
};
