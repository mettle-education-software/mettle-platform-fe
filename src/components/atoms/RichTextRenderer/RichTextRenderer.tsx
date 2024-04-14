import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS, Node, Document } from '@contentful/rich-text-types';
import styled from '@emotion/styled';
import { Typography } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

const { Title, Paragraph } = Typography;

interface IAsset {
    sys: {
        id: string;
    };
}

interface ILinks {
    assets: {
        block: IAsset[];
    };
}

interface TextSectionProps {
    rawContent: Document;
    links: ILinks;
}

const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: flex-start;

    & > * {
        text-align: justify;
    }

    & > h1 {
        font-size: 3.2rem;
    }

    & > h2 {
        font-size: 2.5rem;
    }

    & > h3 {
        font-size: 2rem;
    }
`;

const HyperLink = styled(Link)`
    font-weight: 700;
    color: blue;

    &::after {
        content: '\\2197'; /* Unicode code for the up-right arrow */
        font-size: inherit;
    }

    &:hover {
        text-decoration: underline;
    }
`;

const EmbedImage = styled(Image)`
    width: 100%;
    height: 100%;
    max-width: 30rem;
    text-align: center;
    align-self: center;
    border-radius: 1rem;
    box-shadow: 0 20px 100px 0.000000008rem rgb(107, 107, 107, 0.2);
    margin-top: 2rem;
`;

const renderOptions = (links: ILinks): Options => {
    const assetMap = new Map();

    links?.assets?.block?.forEach((asset: IAsset) => {
        assetMap.set(asset.sys.id, asset);
    });

    return {
        renderMark: {
            [MARKS.BOLD]: (text: ReactNode) => <strong>{text}</strong>,
            [MARKS.ITALIC]: (text: ReactNode) => <em>{text}</em>,
        },
        renderNode: {
            [BLOCKS.PARAGRAPH]: (node: Node, children: ReactNode) => <Paragraph>{children}</Paragraph>,
            [BLOCKS.HEADING_1]: (node: Node, children: ReactNode) => <Title level={1}>{children}</Title>,
            [BLOCKS.HEADING_2]: (node: Node, children: ReactNode) => <Title level={2}>{children}</Title>,
            [BLOCKS.HEADING_3]: (node: Node, children: ReactNode) => <Title level={3}>{children}</Title>,
            [BLOCKS.HEADING_4]: (node: Node, children: ReactNode) => <Title level={4}>{children}</Title>,
            [BLOCKS.HEADING_5]: (node: Node, children: ReactNode) => <Title level={5}>{children}</Title>,
            [BLOCKS.HEADING_6]: (node: Node, children: ReactNode) => <Title level={5}>{children}</Title>,
            [BLOCKS.EMBEDDED_ASSET]: (node: Node) => {
                const asset = assetMap.get(node.data.target.sys.id);

                return (
                    <EmbedImage
                        src={asset.url}
                        width={300}
                        height={300}
                        alt={asset.title ? asset.title : 'Embed text image'}
                    />
                );
            },
            // [INLINES.EMBEDDED_ENTRY]: (node: Node) => {
            //     return <p>LINK WILL BE HERE {JSON.stringify(node)}</p>;
            // },
            [INLINES.HYPERLINK]: (node: Node, children: ReactNode) => (
                <HyperLink href={node.data.uri} target="_blank">
                    {children}
                </HyperLink>
            ),
        },
    };
};

export const RichTextRenderer = ({ rawContent, links }: TextSectionProps) => {
    return <TextWrapper>{documentToReactComponents(rawContent, renderOptions(links))}</TextWrapper>;
};
