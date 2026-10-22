import { afterEach, describe, expect, it } from "vitest";
import { getSellerChannel, isDemoMode } from "./channel";
import {
  buildSellerQuestions,
  buildSellerTimeline,
  createSellerToken,
  isSellerToken,
  sellerChannelForToken,
  simulationPlan,
} from "./tokens";

const originalDemoMode = process.env.DEMO_MODE;

afterEach(() => {
  if (originalDemoMode === undefined) {
    delete process.env.DEMO_MODE;
  } else {
    process.env.DEMO_MODE = originalDemoMode;
  }
});

describe("seller tokens", () => {
  it("creates channel-specific valid tokens", () => {
    const link = createSellerToken("link");
    const simulator = createSellerToken("simulator");

    expect(link.startsWith("lnk_")).toBe(true);
    expect(simulator.startsWith("sim_")).toBe(true);
    expect(isSellerToken(link)).toBe(true);
    expect(isSellerToken(simulator)).toBe(true);
    expect(isSellerToken("bad-token")).toBe(false);
    expect(sellerChannelForToken(link)).toBe("link");
    expect(sellerChannelForToken(simulator)).toBe("simulator");
  });

  it("keeps simulation deterministic and within the expected window", () => {
    const token = "sim_deterministic_token_12345678";
    const first = simulationPlan(token);
    const second = simulationPlan(token);

    expect(first).toEqual(second);
    expect(first.delayMs).toBeGreaterThanOrEqual(6000);
    expect(first.delayMs).toBeLessThan(12000);
    expect(["in_stock", "out_of_stock", "no_answer"]).toContain(first.outcome);
  });
});

describe("seller questions", () => {
  it("always asks about stock and price", () => {
    expect(
      buildSellerQuestions({ hasHours: false, warrantyProvider: null }).map(
        (question) => question.key,
      ),
    ).toEqual(["stock", "price"]);
  });

  it("adds hours and warranty when data exists", () => {
    expect(
      buildSellerQuestions({
        hasHours: true,
        warrantyProvider: "شرکت گارانتی",
      }).map((question) => question.key),
    ).toEqual(["stock", "price", "hours", "warranty"]);
  });
});

describe("seller timeline", () => {
  const base = {
    createdAt: "2026-10-22T10:00:00.000Z",
    sentAt: "2026-10-22T10:00:01.000Z",
    viewedAt: null,
    expiresAt: "2026-10-29T10:00:00.000Z",
  };

  it("shows waiting state for a sent check", () => {
    const steps = buildSellerTimeline({
      ...base,
      status: "sent",
      answeredAt: null,
    });
    expect(steps[1].state).toBe("done");
    expect(steps[2].state).toBe("active");
    expect(steps[3].state).toBe("active");
    expect(steps[4].state).toBe("pending");
  });

  it("marks an answered check as complete", () => {
    const steps = buildSellerTimeline({
      ...base,
      status: "answered",
      answeredAt: "2026-10-22T10:05:00.000Z",
    });
    expect(steps[3].state).toBe("done");
    expect(steps[3].at).toBe("2026-10-22T10:05:00.000Z");
  });

  it("marks an expired check as failed", () => {
    const steps = buildSellerTimeline({
      ...base,
      status: "expired",
      answeredAt: null,
    });
    expect(steps[3].state).toBe("failed");
    expect(steps[4].state).toBe("failed");
  });
});

describe("seller channels", () => {
  it("uses the simulator only with an exact demo switch", () => {
    process.env.DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
    expect(getSellerChannel().kind).toBe("simulator");

    process.env.DEMO_MODE = "1";
    expect(isDemoMode()).toBe(false);
    expect(getSellerChannel().kind).toBe("link");
  });
});
