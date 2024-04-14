import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const coursesQuery = gql`
    query {
        courseCollection(order: [sys_publishedAt_DESC]) {
            items {
                courseSlug
                courseTitle
                courseFeaturedText
                courseFeaturedImage {
                    url
                }
                introductionVideo
                courseModulesCollection(limit: 50) {
                    items {
                        ... on DedaContent {
                            dedaId
                        }
                        ... on Module {
                            moduleId
                            lessonsCollection(limit: 1) {
                                items {
                                    lessonId
                                }
                            }
                        }
                        ... on HpecContent {
                            hpecId
                            hpecLessonsCollection(limit: 1) {
                                items {
                                    lessonId
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

const useGetCourses = () => {
    return useQuery(coursesQuery);
};

export default useGetCourses;
