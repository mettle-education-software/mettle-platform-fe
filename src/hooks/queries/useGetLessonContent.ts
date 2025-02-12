import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { LinkType } from 'interfaces';

const lessonContentQuery = gql`
    query LessonQuery($lessonId: String) {
        singleLessonCollection(where: { lessonId: $lessonId }, limit: 1) {
            items {
                lessonId
                lessonTitle
                lessonVideoEmbedUrl
                lessonFeaturedText
                lessonContent {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                lessonResourcesCollection {
                    items {
                        url
                    }
                }
            }
        }
    }
`;

interface LessonResponse {
    singleLessonCollection: {
        items: {
            lessonFeaturedText: string;
            lessonId: string;
            lessonTitle: string;
            lessonVideoEmbedUrl: string;
            lessonContent: {
                json: any;
                links: LinkType;
            };
            lessonResourcesCollection: {
                items: {
                    url: string;
                    title: string;
                    fileName: string;
                    contentType: string;
                    size: number;
                }[];
            };
        }[];
    };
}

const useGetLessonContent = (lessonId?: string) => {
    return useQuery<LessonResponse>(lessonContentQuery, {
        variables: {
            lessonId,
        },
        fetchPolicy: 'cache-first',
        skip: lessonId === 'first-lesson',
    });
};

export default useGetLessonContent;
