import { FileFilled, PlayCircleFilled } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Card, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { ArticleFrame, VideoFrame } from 'components';
import { withDedaActivity } from 'components/HOCs';
import { useGetDedaVideosArticles } from 'hooks';
import React from 'react';

const { Title, Text } = Typography;

const LinknowledgeContainer = styled(Card)`
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    border: none;
    padding: 2rem 0;
`;

const AssetCard = styled(Card)`
    background-color: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    border: none;
    height: 100%;

    .ant-card-head {
        border-bottom: none;
    }
`;

const DedaStepsCompletedRaw = ({ dedaId }: { dedaId: string }) => {
    const { data, loading } = useGetDedaVideosArticles(dedaId);

    const todayIndex = new Date().getDay() === 0 ? 7 : new Date().getDay();

    const article = data?.dedaContentCollection.items[0].dedaNotesArticlesLinksCollection.items[todayIndex - 1];
    const video = data?.dedaContentCollection.items[0].dedaNotesVideosLinksCollection.items[todayIndex - 1];

    return (
        <LinknowledgeContainer>
            <Flex vertical gap="22px" align="center">
                <Flex vertical align="center" gap="0.5rem">
                    <Title level={3} className="color-white">
                        Here is your Article and Video of the day
                    </Title>
                    <Text className="color-white">
                        (you can also find them in the <span className="color-secondary">DEDA LinKnowledge</span>{' '}
                        section)
                    </Text>
                </Flex>
                <Skeleton active loading={loading}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <AssetCard
                                title={
                                    <Flex justify="flex-start" gap="0.8rem" align="center">
                                        <FileFilled className="color-white" />{' '}
                                        <Title level={4} style={{ fontWeight: 400 }} className="color-white">
                                            Article
                                        </Title>
                                    </Flex>
                                }
                            >
                                <ArticleFrame
                                    fullWidth
                                    href={article?.magicLinkUrl as string}
                                    title={article?.magicLinkLabel as string}
                                />
                            </AssetCard>
                        </Col>
                        <Col span={12}>
                            <AssetCard
                                title={
                                    <Flex justify="flex-start" gap="0.8rem" align="center">
                                        <PlayCircleFilled className="color-white" />{' '}
                                        <Title level={4} style={{ fontWeight: 400 }} className="color-white">
                                            Video
                                        </Title>
                                    </Flex>
                                }
                            >
                                <VideoFrame
                                    fullWidth
                                    videoSrc={video?.magicLinkUrl as string}
                                    title={video?.magicLinkLabel as string}
                                />
                            </AssetCard>
                        </Col>
                    </Row>
                </Skeleton>
            </Flex>
        </LinknowledgeContainer>
    );
};

export const DedaStepsCompleted = DedaStepsCompletedRaw;
