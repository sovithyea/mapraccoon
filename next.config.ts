import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 writes its own AGENTS.md / CLAUDE.md on dev start. This repo keeps
  // hand-written ones (see docs/DECISIONS.md D13), so the generator is off.
  agentRules: false,
};

export default nextConfig;
