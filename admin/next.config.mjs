/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'sinod.app' },
            { protocol: 'https', hostname: 'nyc.cloud.appwrite.io' },
            { protocol: 'https', hostname: 'img.youtube.com' },
        ],
    },
};

export default nextConfig;
