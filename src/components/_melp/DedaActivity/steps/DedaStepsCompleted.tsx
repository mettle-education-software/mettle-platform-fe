import { SmileOutlined } from '@ant-design/icons';
import { Result, Typography } from 'antd';
import { withDedaActivity } from 'components/HOCs';
import React from 'react';

const DedaStepsCompletedRaw = () => {
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

export const DedaStepsCompleted = withDedaActivity(DedaStepsCompletedRaw);
