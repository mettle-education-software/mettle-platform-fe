'use client';

import { AppLayout } from 'components/layouts';
import { withAuthentication } from 'libs';
import React from 'react';

function DedaContent() {
    return <AppLayout withMelpSummary>deda content</AppLayout>;
}

export default withAuthentication(DedaContent);
