import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';

const unlockedDedasQuery = gql`
    query UnlockedDedas($unlockedDedasIDs: [String]) {
        dedaContentCollection(where: { dedaId_in: $unlockedDedasIDs }) {
            items {
                dedaTitle
                dedaId
            }
        }
    }
`;

export const useUnlockedDedasList = (unlockedDedasIDs: string[]) =>
    useQuery(unlockedDedasQuery, {
        variables: {
            unlockedDedasIDs,
        },
    });
