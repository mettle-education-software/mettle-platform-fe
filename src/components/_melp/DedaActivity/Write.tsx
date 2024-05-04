'use client';

import React from 'react';

interface WriteProps {
    dedaId: string;
}

export const Write: React.FC<WriteProps> = ({ dedaId }) => {
    return <h1>Write {dedaId}</h1>;
};
