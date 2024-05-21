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

const allDedasQuery = gql`
    query AllDedas {
        dedaContentCollection(order: [dedaId_ASC]) {
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
