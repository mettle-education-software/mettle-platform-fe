/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['images.ctfassets.net', 'via.placeholder.com', 'vumbnail.com'],
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
        TAWK_TO_PROPERTY_ID: process.env.TAWK_TO_PROPERTY_ID,
        TAWK_TO_WIDGET_ID: process.env.TAWK_TO_WIDGET_ID,
        TAWK_TO_CHAT_LINK: process.env.TAWK_TO_CHAT_LINK,
    },
    publicRuntimeConfig: {
        SENTRY_DSN: process.env.SENTRY_DSN,
    },
    experimental: {
        serverComponentsExternalPackages: ['antd', 'antd/lib'],
    },
};

export default nextConfig;
