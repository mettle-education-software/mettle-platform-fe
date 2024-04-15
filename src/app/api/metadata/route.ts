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
        const response = await axios.get(url);
        const metadata = extractMetadata(response.data);
        return Response.json(metadata);
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
