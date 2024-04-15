'use client';

import { Typography } from 'antd';
import { withAuthentication } from 'libs';

function Home() {
    return <Typography.Title>Welcome to Melp!!</Typography.Title>;
}

export default withAuthentication(Home);
