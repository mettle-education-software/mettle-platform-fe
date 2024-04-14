import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const searchQuery = gql`
    query SearchQuery($searchString: [String]) {
        courseCollection(
            where: {
                OR: [
                    { courseFeaturedText_contains: $searchString }
                    { courseSlug_contains: $searchString }
                    { courseTitle_contains: $searchString }
                ]
            }
        ) {
            items {
                courseSlug
                courseTitle
                courseFeaturedText
                courseFeaturedImage {
                    url
                }
                courseModulesCollection(limit: 1) {
                    items {
                        lessonsCollection(limit: 1) {
                            items {
                                lessonId
                            }
                        }
                    }
                }
            }
        }
    }
`;

const useGetCourses = (searchString: string) => {
    return useQuery(searchQuery, {
        variables: {
            searchString,
        },
    });
};

export default useGetCourses;
