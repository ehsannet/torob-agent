import type { SellerChannelKind } from "./tokens";
import { createSellerToken } from "./tokens";

export type SellerChannel = {
  kind: SellerChannelKind;
  automatic: boolean;
  createToken: () => string;
  sellerPath: (token: string) => string;
  send: (check: { token: string }) => Promise<{
    linkPath: string;
    automatic: boolean;
  }>;
};

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

const linkChannel: SellerChannel = {
  kind: "link",
  automatic: false,
  createToken: () => createSellerToken("link"),
  sellerPath: (token) => `/s/${token}`,
  send: async (check) => ({
    linkPath: `/s/${check.token}`,
    automatic: false,
  }),
};

const simulatorChannel: SellerChannel = {
  kind: "simulator",
  automatic: true,
  createToken: () => createSellerToken("simulator"),
  sellerPath: (token) => `/s/${token}`,
  send: async (check) => ({
    linkPath: `/s/${check.token}`,
    automatic: true,
  }),
};

export function getSellerChannel(): SellerChannel {
  return isDemoMode() ? simulatorChannel : linkChannel;
}

export function sellerChannel(kind: SellerChannelKind): SellerChannel {
  return kind === "simulator" ? simulatorChannel : linkChannel;
}
