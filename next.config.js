const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  // Enable static export for GitHub Pages
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Base path for GitHub Pages (update this to your repo name if needed)
  // basePath: '/open-power',
  // Trailing slash for GitHub Pages compatibility
  trailingSlash: true,
}

module.exports = nextConfig
