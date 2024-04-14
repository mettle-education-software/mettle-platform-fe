/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['images.ctfassets.net', 'via.placeholder.com'],
    },
    env: {
        FB_API_KEY: process.env.FB_API_KEY,
        FB_AUTH_DOMAIN: process.env.FB_AUTH_DOMAIN,
        FB_DATABASE_URL: process.env.FB_DATABASE_URL,
        FB_PROJECT_ID: process.env.FB_PROJECT_ID,
        FB_STORAGE_BUCKET: process.env.FB_STORAGE_BUCKET,
        FB_MESSAGING_SENDER_ID: process.env.FB_MESSAGING_SENDER_ID,
        FB_APP_ID: process.env.FB_APP_ID,
        FB_MEASUREMENT_ID: process.env.FB_MEASUREMENT_ID,
        METTLE_API_URL: process.env.METTLE_API_URL,
        SENTRY_DSN: process.env.SENTRY_DSN,
        GRAPHQL_URI: process.env.CONTENTFUL_GRAPHQL_URI,
    },
    publicRuntimeConfig: {
        SENTRY_DSN: process.env.SENTRY_DSN,
    },
};

export default nextConfig;
