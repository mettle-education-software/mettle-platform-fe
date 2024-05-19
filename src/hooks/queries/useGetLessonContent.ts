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
        }[];
    };
}

const useGetLessonContent = (lessonId?: string) => {
    return useQuery<LessonResponse>(lessonContentQuery, {
        variables: {
            lessonId,
        },
        fetchPolicy: 'cache-first',
    });
};

export default useGetLessonContent;
