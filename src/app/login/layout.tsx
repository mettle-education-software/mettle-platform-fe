'use client';

import { AuthenticationDesign } from 'components/layouts/AuthenticationLayout/AuthenticationDesign';
import { withoutAuthentication } from 'libs';
import React from 'react';

function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return <AuthenticationDesign>{children}</AuthenticationDesign>;
}

export default withoutAuthentication(LoginLayout);
