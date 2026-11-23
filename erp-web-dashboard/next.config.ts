import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  /**
   * Dashboard dibuka dari HP/emulator lewat IP LAN (mis. 192.168.1.2) saat
   * menguji aplikasi mobile, jadi origin itu perlu diizinkan untuk resource
   * dev Next (HMR + /_next/*).
   */
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.2", "192.168.1.*", "10.0.2.2"],
};

export default nextConfig;