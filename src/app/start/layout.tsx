'use client';

import { AuthenticationLayout } from 'components';
import { withoutAuthentication } from 'libs';
import React from 'react';

function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return <AuthenticationLayout>{children}</AuthenticationLayout>;
}

export default withoutAuthentication(LoginLayout);
