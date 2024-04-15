'use client';

import { AppLayout } from 'components/layouts';
import { withAuthentication } from 'libs';
import React from 'react';

function HpecContent({ params: { hpecId } }: { params: { hpecId: string } }) {
    return <AppLayout withMelpSummary>HPEC content {hpecId}</AppLayout>;
}

export default withAuthentication(HpecContent);
