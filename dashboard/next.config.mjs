/** @type {import('next').NextConfig} */
const nextConfig = {
  // The playbook markdown lives one level up, in the repo root.
  outputFileTracingIncludes: { "/playbook": ["../transaction-coordinator.md"] },
  serverExternalPackages: ["googleapis"],
  experimental: { serverActions: { bodySizeLimit: "35mb" } },
};
export default nextConfig;
