/** @type {import('next').NextConfig} */
const repoName = "Stratum";
const basePath = `/${repoName}`;

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: `${basePath}/`,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
