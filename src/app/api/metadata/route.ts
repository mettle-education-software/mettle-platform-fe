import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { fetchPublicHtml, isUnsafeUrlError } from '../_lib/safeFetch';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const url = searchParams.get('url');

    if (!url) {
        return redirect('/404');
    }

    try {
        const { response, isHtml } = await fetchPublicHtml(url);
        const xFrameOptions = response.headers['x-frame-options'];

        if (response.status !== 200) {
            return Response.json({ error: 'Unable to fetch url' }, { status: 502 });
        }

        // PDF e outros formatos seguem valendo para o embed; só não têm og:image.
        const metadata = isHtml && typeof response.data === 'string' ? extractMetadata(response.data) : { image: null };

        if (xFrameOptions && (xFrameOptions.toLowerCase() === 'deny' || xFrameOptions.toLowerCase() === 'sameorigin')) {
            return new Response(
                JSON.stringify({
                    canEmbed: false,
                    reason: 'X-Frame-Options header prevents embedding',
                    ...metadata,
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        return new Response(JSON.stringify({ canEmbed: true, ...metadata }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        if (isUnsafeUrlError(error)) {
            return Response.json({ error: 'Invalid url parameter' }, { status: 400 });
        }
        console.error(error);
        return Response.json({ error: 'Unable to fetch url' }, { status: 502 });
    }
}

function extractMetadata(htmlContent: string): { image: string | null } {
    const ogImageRegex = /<meta property="og:image" content="([^"]+)"/i;
    const matches = ogImageRegex.exec(htmlContent);
    const image = matches ? matches[1] : null;
    // Só https: a imagem é carregada pelo navegador do aluno.
    return { image: image?.startsWith('https://') ? image : null };
}
