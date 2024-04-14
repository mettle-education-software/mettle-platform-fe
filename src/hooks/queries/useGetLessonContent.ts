import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const lessonContentQuery = gql`
    query LessonQuery($lessonId: String) {
        singleLessonCollection(where: { lessonId: $lessonId }, limit: 1) {
            items {
                lessonId
                lessonTitle
                lessonVideoEmbedUrl
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

const useGetLessonContent = (lessonId?: string) => {
    return useQuery(lessonContentQuery, {
        variables: {
            lessonId,
        },
    });
};

export default useGetLessonContent;
