'use client';

import styled from '@emotion/styled';
import { Skeleton, Typography } from 'antd';
import { transformRichTextToString } from 'components/atoms/RichTextRenderer/RichTextRenderer';
import { useGetDedaQuote } from 'hooks';
import React from 'react';

const { Text } = Typography;

interface DedaQuoteProps {
    dedaId: string;
}

const QuoteText = styled(Text)`
    color: #ffffff;

    & * {
        color: #ffffff;
        white-space: break-spaces;
    }
`;

export const DedaQuote: React.FC<DedaQuoteProps> = ({ dedaId }) => {
    const { data: dedaQuoteResult, loading } = useGetDedaQuote(dedaId);

    if (loading) return <Skeleton active paragraph />;

    const content = dedaQuoteResult?.dedaContentCollection.items[0];

    if (!content) return null;

    return (
        <QuoteText>
            {transformRichTextToString({
                rawContent: content?.dedaNotesQuote.json,
            })}
        </QuoteText>
    );
};
