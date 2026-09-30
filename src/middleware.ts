import { legacyRedirectTarget } from 'libs/cleanUrls';
import { NextRequest, NextResponse } from 'next/server';

const contentful = async <T>(query: string, variables: Record<string, string>): Promise<T | null> => {
    try {
        const response = await fetch(process.env.GRAPHQL_URI as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
            next: { revalidate: 3600 },
        });
        if (!response.ok) return null;
        return (await response.json()).data ?? null;
    } catch {
        return null;
    }
};

const lookups = {
    dedaSlugOf: async (dedaId: string) => {
        const data = await contentful<{ dedaContentCollection: { items: { dedaSlug: string | null }[] } }>(
            'query($dedaId: String) { dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) { items { dedaSlug } } }',
            { dedaId },
        );
        return data?.dedaContentCollection.items[0]?.dedaSlug ?? null;
    },
    firstLessonOf: async (hpecId: string) => {
        const data = await contentful<{
            hpecContentCollection: { items: { hpecLessonsCollection: { items: { lessonId: string }[] } }[] };
        }>(
            'query($hpecId: String) { hpecContentCollection(where: { hpecId: $hpecId }, limit: 1) { items { hpecLessonsCollection(limit: 1) { items { lessonId } } } } }',
            { hpecId },
        );
        return data?.hpecContentCollection.items[0]?.hpecLessonsCollection.items[0]?.lessonId ?? null;
    },
};

export async function middleware(req: NextRequest) {
    const target = await legacyRedirectTarget(req.nextUrl.pathname, lookups);
    if (!target) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
}

export const config = {
    matcher: ['/imerso/deda/:dedaId/:path*', '/imerso/hpec/:hpecId/:lessonId'],
};
