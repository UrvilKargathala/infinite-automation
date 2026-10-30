/** @type {import('next').NextConfig} */
const nextConfig = {
  // The CRM board moved from /projects to /crm — keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/projects", destination: "/crm", permanent: true },
      { source: "/projects/:path*", destination: "/crm/:path*", permanent: true },
    ];
  },
};
module.exports = nextConfig;
