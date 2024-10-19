'use client';

import { withoutAuthentication } from 'libs';
import React from 'react';

function SignupLayout({ children }: { children: React.ReactNode }) {
    return children;
}

export default withoutAuthentication(SignupLayout);
