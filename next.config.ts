import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora gli errori di TypeScript durante la pubblicazione su Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Nelle nuove versioni di Next.js, la configurazione di ESLint 
  // non va più inserita in questo file, per questo è stata rimossa.
};

export default nextConfig;