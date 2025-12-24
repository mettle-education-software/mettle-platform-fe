'use client';

import { Col, Flex, Row, Skeleton } from 'antd';
import { DedaRateInput } from 'components/_melp/DedaInput/DedaInput';
import { useGetOverallStatsReport } from 'hooks';
import { OverallStatsEnum } from 'interfaces';
import React from 'react';
import { InputWithTime } from '../../InputWithTime/InputWithTime';
import { InputsWrapper } from '../../InputsWrapper/InputsWrapper';
import { SectionTitle } from '../../SectionTitle/SectionTitle';

interface OverallStatsReportProps extends Readonly<Record<string, unknown>> {
    sortBy?: 'ASC' | 'DESC';
}

export const OverallStatsReport: React.FC<OverallStatsReportProps> = ({ sortBy }) => {
    const { data: reportData, isLoading } = useGetOverallStatsReport(sortBy);

    if (isLoading || !reportData) {
        return <Skeleton active loading paragraph={{ rows: 10 }} />;
    }

    const { dedaAverages, activeStudyTotals, passiveStudyTotals } = reportData;

    const { readingTimeSum, dedaTimeSum, ...restDedaAverages } = dedaAverages;

    return (
        <Row align="top" gutter={[24, 24]}>
            <Col xs={24} md={8}>
                <Flex vertical gap="1rem">
                    <SectionTitle title="DEDA" subtitle="" />
                    <Flex vertical gap="1rem">
                        <InputsWrapper>
                            {Object.entries(restDedaAverages).map(([key, value]) => (
                                <DedaRateInput
                                    key={key + value}
                                    label={OverallStatsEnum[key as keyof typeof OverallStatsEnum]}
                                    value={value}
                                    displayMode
                                />
                            ))}
                        </InputsWrapper>
                        <InputsWrapper>
                            <InputWithTime label="Reading Time" value={0} displayValueOnly={readingTimeSum} />
                            <InputWithTime label="DEDA Time" value={0} displayValueOnly={dedaTimeSum} />
                        </InputsWrapper>
                    </Flex>
                </Flex>
            </Col>

            <Col xs={24} md={8}>
                <Flex vertical gap="1rem">
                    <SectionTitle title="Active" subtitle="" />
                    <Flex vertical gap="1rem">
                        <InputsWrapper>
                            {Object.entries(activeStudyTotals).map(([key, value]) => (
                                <InputWithTime
                                    key={key + value}
                                    label={OverallStatsEnum[key as keyof typeof OverallStatsEnum]}
                                    value={0}
                                    displayValueOnly={value}
                                />
                            ))}
                        </InputsWrapper>
                    </Flex>
                </Flex>
            </Col>

            <Col xs={24} md={8}>
                <Flex vertical gap="1rem">
                    <SectionTitle title="Passive" subtitle="" />
                    <Flex vertical gap="1rem">
                        <InputsWrapper>
                            {Object.entries(passiveStudyTotals).map(([key, value]) => (
                                <InputWithTime
                                    key={key + value}
                                    label={OverallStatsEnum[key as keyof typeof OverallStatsEnum]}
                                    value={0}
                                    displayValueOnly={value}
                                />
                            ))}
                        </InputsWrapper>
                    </Flex>
                </Flex>
            </Col>
        </Row>
    );
};
