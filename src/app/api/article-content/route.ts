import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { NextRequest } from 'next/server';
import { fetchPublicHtml, isUnsafeUrlError } from '../_lib/safeFetch';
import { sanitizeHtml } from '../_lib/sanitizeHtml';

type ArticlePayload = {
    title: string;
    content: string;
    textContent: string;
    excerpt: string | null;
    byline: string | null;
    siteName: string | null;
    length: number;
};

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return Response.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const { response, isHtml, finalUrl } = await fetchPublicHtml(url);

        if (response.status !== 200 || !isHtml || typeof response.data !== 'string') {
            return Response.json({ error: 'Unable to fetch article content' }, { status: 502 });
        }

        const dom = new JSDOM(response.data, { url: finalUrl });
        const article = new Readability(dom.window.document).parse();

        if (!article?.content) {
            return Response.json({ error: 'Unable to parse article content' }, { status: 422 });
        }

        const sanitizedContent = sanitizeHtml(article.content);

        const payload: ArticlePayload = {
            title: article.title ?? '',
            content: sanitizedContent,
            textContent: article.textContent ?? '',
            excerpt: article.excerpt ?? null,
            byline: article.byline ?? null,
            siteName: article.siteName ?? null,
            length: article.length ?? 0,
        };

        return Response.json(payload);
    } catch (error) {
        if (isUnsafeUrlError(error)) {
            return Response.json({ error: 'Invalid url parameter' }, { status: 400 });
        }
        console.error(error);
        return Response.json({ error: 'Unexpected error while reading article' }, { status: 500 });
    }
}
