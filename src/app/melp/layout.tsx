'use client';

import { AppLayout } from 'components';
import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const MelpLayout: React.FC<LayoutProps> = ({ children }) => {
    return <AppLayout withMelpSummary>{children}</AppLayout>;
};

export default MelpLayout;
