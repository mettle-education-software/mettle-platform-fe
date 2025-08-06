import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, Document, INLINES, MARKS, Node } from '@contentful/rich-text-types';
import styled from '@emotion/styled';
import { Typography } from 'antd';
import { LinkType } from 'interfaces';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

const { Title, Paragraph } = Typography;

interface IAsset {
    sys: {
        id: string;
    };
}

interface TextSectionProps {
    rawContent: Document;
    links?: LinkType;
    justify?: boolean;
}

const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    align-items: flex-start;

    & > * {
        text-align: justify;
        margin-bottom: 0 !important;
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
    color: #3030e8;

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

const renderOptions = (links?: LinkType, justify?: boolean, toString?: boolean): Options => {
    const assetMap = new Map();

    links?.assets?.block?.forEach((asset: IAsset) => {
        assetMap.set(asset.sys.id, asset);
    });

    return {
        renderMark: {
            [MARKS.BOLD]: (text: ReactNode) => (toString ? `${text}` : <strong>{text}</strong>),
            [MARKS.ITALIC]: (text: ReactNode) => (toString ? `${text}` : <em>{text}</em>),
        },
        renderNode: {
            [BLOCKS.PARAGRAPH]: (node: Node, children: ReactNode) =>
                toString ? (
                    children
                ) : (
                    <Paragraph
                        style={{
                            whiteSpace: 'break-spaces',
                            textAlign: justify ? 'justify' : undefined,
                        }}
                    >
                        {children}
                    </Paragraph>
                ),
            [BLOCKS.HEADING_1]: (node: Node, children: ReactNode) =>
                toString ? `${children}` : <Title level={1}>{children}</Title>,
            [BLOCKS.HEADING_2]: (node: Node, children: ReactNode) =>
                toString ? `${children}` : <Title level={2}>{children}</Title>,
            [BLOCKS.HEADING_3]: (node: Node, children: ReactNode) =>
                toString ? `${children}` : <Title level={3}>{children}</Title>,
            [BLOCKS.HEADING_4]: (node: Node, children: ReactNode) =>
                toString ? `${children}` : <Title level={4}>{children}</Title>,
            [BLOCKS.HEADING_5]: (node: Node, children: ReactNode) =>
                toString ? `${children}` : <Title level={5}>{children}</Title>,
            [BLOCKS.HEADING_6]: (node: Node, children: ReactNode) =>
                toString ? `${children}` : <Title level={5}>{children}</Title>,
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
                    {toString ? `${children}` : children}
                </HyperLink>
            ),
        },
    };
};

export const RichTextRenderer = ({ rawContent, links, justify = false }: TextSectionProps) => {
    return <TextWrapper>{documentToReactComponents(rawContent, renderOptions(links, justify, false))}</TextWrapper>;
};

export const transformRichTextToString = ({ rawContent, links }: TextSectionProps) => {
    return documentToReactComponents(rawContent, renderOptions(links, false, true));
};
