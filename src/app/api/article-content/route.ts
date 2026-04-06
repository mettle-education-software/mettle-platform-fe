import { Readability } from '@mozilla/readability';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { NextRequest } from 'next/server';

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
        new URL(url);
    } catch {
        return Response.json({ error: 'Invalid url parameter' }, { status: 400 });
    }

    try {
        const response = await axios.get<string>(url, {
            responseType: 'text',
            validateStatus: null,
        });

        if (response.status !== 200 || typeof response.data !== 'string') {
            return Response.json({ error: 'Unable to fetch article content' }, { status: 502 });
        }

        const dom = new JSDOM(response.data, { url });
        const article = new Readability(dom.window.document).parse();

        if (!article?.content) {
            return Response.json({ error: 'Unable to parse article content' }, { status: 422 });
        }

        const sanitizedContent = sanitizeArticleContent(article.content);

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
        console.error(error);
        return Response.json({ error: 'Unexpected error while reading article' }, { status: 500 });
    }
}

function sanitizeArticleContent(content: string) {
    const dom = new JSDOM(content);
    const { document } = dom.window;

    document
        .querySelectorAll('script, style, iframe, frame, frameset, object, embed, form, input, button, image, img')
        .forEach((node: Element) => {
            node.remove();
        });

    document.querySelectorAll('*').forEach((element: Element) => {
        [...element.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();

            if (name.startsWith('on')) {
                element.removeAttribute(attribute.name);
                return;
            }

            if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    return document.body.innerHTML;
}
