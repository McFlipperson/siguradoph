/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // thermal-printer-encoder only exports under the "browser" condition.
    // Tell webpack to prefer that condition when bundling client code.
    config.resolve.conditionNames = ['browser', 'import', 'require', 'default']
    return config
  },
}

export default nextConfig;
