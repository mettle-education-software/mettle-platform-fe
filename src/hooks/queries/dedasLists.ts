import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { AllDedasResponse, NextDedasResponse, LastDedasResponse } from 'interfaces';

const items = `
        items {
            dedaId
            dedaSlug
            dedaFeaturedImage {
                url
            }
            dedaTitle
            dedaCategories
        }
`;

const lastDedasQuery = gql`
    query LastDedas($dedasList: [String]) {
        dedaContentCollection(where: { dedaId_in: $dedasList }) {
            ${items}
        }
    }
`;

const nextDedasQuery = gql`
    query NextDedas($dedasList: [String]) {
        dedaContentCollection(where: { dedaId_in: $dedasList }) {
            ${items}
        }
    }
`;

// O círculo cresce (104 → 156+): pede o máximo que o espelho e a Content API aceitam numa página.
// ponytail: teto de 1000 DEDAs (~19 anos de semanas); paginar com `skip` se um dia passar disso.
const allDedasQuery = gql`
    query AllDedas {
        dedaContentCollection(order: [dedaId_ASC], limit: 1000) {
            ${items}
        }
    }
`;

export const useLastDedas = (dedasList?: string[]) =>
    useQuery<LastDedasResponse>(lastDedasQuery, {
        variables: { dedasList },
        skip: !dedasList,
    });

export const useNextDedas = (dedasList?: string[]) =>
    useQuery<NextDedasResponse>(nextDedasQuery, {
        variables: { dedasList },
        skip: !dedasList,
    });

export const useAllDedasList = (disabled: boolean) => useQuery<AllDedasResponse>(allDedasQuery, { skip: disabled });
