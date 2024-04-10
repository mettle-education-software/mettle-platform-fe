'use client';

import { Typography } from 'antd';
import { withAuthentication } from 'libs';

function Page() {
    return <Typography.Title>Hello!</Typography.Title>;
}

export default withAuthentication(Page);
