import axios from 'axios';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const url = searchParams.get('url');

    if (!url) {
        return redirect('/404');
    }

    try {
        const response = await axios.get(url, { validateStatus: null }).catch((error) => error);
        const xFrameOptions = response.headers['x-frame-options'];

        if (response.status !== 200) {
            return Response.error();
        }

        const metadata = extractMetadata(response.data);

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
        console.error(error);
        throw error;
    }
}

function extractMetadata(htmlContent: string): { image: string | null } {
    const ogImageRegex = /<meta property="og:image" content="([^"]+)"/i;
    const matches = ogImageRegex.exec(htmlContent);
    return {
        image: matches ? matches[1] : null, // Return null if no match is found
    };
}
