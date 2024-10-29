import { withSentryConfig } from '@sentry/nextjs';

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
};

export default withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: 'mettle-education-software',
    project: 'plataforma-mettle',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
        enabled: true,
    },

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
});
