import { SmileOutlined } from '@ant-design/icons';
import { Result, Typography } from 'antd';
import React from 'react';

export const DedaStepsCompleted = () => {
    return (
        <Result
            icon={<SmileOutlined style={{ color: 'white' }} />}
            title={
                <Typography.Title level={2} style={{ color: 'white' }}>
                    Great, you have completed DEDA today.
                </Typography.Title>
            }
        />
    );
};
