'use client';

import { AppLayout } from 'components';
import { withAuthentication } from 'libs';
import React from 'react';

function CommunityPage() {
    return (
        <AppLayout withMelpSummary>
            <div style={{ width: '100%', height: '100vh' }}>
                <iframe
                    style={{ width: '100%', height: '100%' }}
                    src="https://pedros-community-da05a9.circle.so/c/melp-users?iframe=true"
                />
            </div>
        </AppLayout>
    );
}

export default withAuthentication(CommunityPage);
