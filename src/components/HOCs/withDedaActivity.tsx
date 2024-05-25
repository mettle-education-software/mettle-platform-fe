'use client';

import React from 'react';

interface WithDedaActivityProps {
    isDedaCompleted: boolean;
}

function withDedaActivity<P extends object>(Component: React.ComponentType<P>): React.FC<P & WithDedaActivityProps> {
    const WithDedaActivity: React.FC<P & WithDedaActivityProps> = (props: P & WithDedaActivityProps) => {
        if (props.isDedaCompleted) {
            return null;
        }
        return <Component {...props} />;
    };

    return WithDedaActivity;
}

export { withDedaActivity };
