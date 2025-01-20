import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const modulesListQuery = gql`
    query ModulesQuery($courseSlug: String) {
        courseCollection(where: { courseSlug: $courseSlug }, limit: 1) {
            items {
                courseModulesCollection {
                    items {
                        ... on Module {
                            moduleId
                            moduleName
                            lessonsCollection {
                                items {
                                    lessonId
                                    lessonTitle
                                    lessonFeaturedText
                                }
                            }
                        }
                        ... on DedaContent {
                            dedaId
                            dedaTitle
                        }
                    }
                }
            }
        }
    }
`;

const useGetModulesList = (courseSlug: string) => {
    return useQuery<
        {
            courseCollection: {
                items: {
                    courseModulesCollection: {
                        items: {
                            moduleId: string;
                            moduleName: string;
                            lessonsCollection: {
                                items: {
                                    lessonId: string;
                                    lessonTitle: string;
                                    lessonFeaturedText: string;
                                }[];
                            };
                        }[];
                    };
                }[];
            };
        },
        {
            courseSlug: string;
        }
    >(modulesListQuery, {
        variables: {
            courseSlug,
        },
        skip: !courseSlug,
    });
};

export default useGetModulesList;
