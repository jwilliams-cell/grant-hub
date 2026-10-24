/** @type {import('next').NextConfig} */
const nextConfig = {
  // prebuild copies the playbook from the repo root into content/.
  outputFileTracingIncludes: { "/playbook": ["./content/transaction-coordinator.md"] },
  serverExternalPackages: ["googleapis"],
  experimental: { serverActions: { bodySizeLimit: "35mb" } },
};
export default nextConfig;
