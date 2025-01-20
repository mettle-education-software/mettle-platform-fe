import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { CourseCollectionResponse, CourseDetailsResponse } from 'interfaces';

const coursesQuery = gql`
    query {
        courseCollection(order: [sys_publishedAt_DESC], where: { isTestProduct: ${process.env.NODE_ENV !== 'production'} }) {
            items {
                courseSlug
                courseTitle
                courseFeaturedText
                courseCategory
                courseFeaturedImage {
                    url
                }
                introductionVideo
                paymentCheckout
                coursePurchaseId
                courseModulesCollection(limit: 50) {
                    items {
                        ... on Module {
                            moduleId
                            moduleName
                            lessonsCollection(limit: 1) {
                                items {
                                    lessonId
                                    lessonTitle
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

export const useGetCourses = () => {
    return useQuery<CourseCollectionResponse>(coursesQuery);
};

const courseQuery = gql`
    query GetSingleCourse($courseSlug: String!) {
        courseCollection(where: { courseSlug: $courseSlug }, limit: 1) {
            items {
                courseSlug
                courseTitle
                courseFeaturedText
                courseFeaturedImage {
                    url
                }
                introductionVideo
                paymentCheckout
                coursePurchaseId
                courseCategory
                courseModulesCollection(limit: 50) {
                    items {
                        ... on Module {
                            moduleId
                            moduleName
                            lessonsCollection(limit: 10) {
                                items {
                                    lessonId
                                    lessonTitle
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

export const useGetCourseDetails = (courseSlug: string) => {
    return useQuery<CourseDetailsResponse>(courseQuery, {
        variables: { courseSlug: courseSlug },
        skip: !courseSlug,
        fetchPolicy: 'cache-first',
    });
};
