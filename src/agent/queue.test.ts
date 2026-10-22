import { describe, expect, it, vi } from "vitest";
import { AgentQueue, QueueTimeoutError } from "./queue";

describe("AgentQueue", () => {
  it("allows only one active job and wakes the next waiter", async () => {
    const queue = new AgentQueue();
    let secondStarted = false;

    const releaseFirst = await queue.acquire();
    const second = queue.acquire().then((release) => {
      secondStarted = true;
      return release;
    });

    await Promise.resolve();
    expect(secondStarted).toBe(false);
    expect(queue.snapshot()).toMatchObject({
      active: true,
      queued: 1,
    });

    releaseFirst("ok");
    const releaseSecond = await second;

    expect(secondStarted).toBe(true);
    expect(queue.snapshot()).toMatchObject({
      active: true,
      queued: 0,
      processed: 1,
    });

    releaseSecond("ok");
    expect(queue.snapshot()).toMatchObject({
      active: false,
      processed: 2,
      failed: 0,
    });
  });

  it("rejects a waiter after the timeout", async () => {
    vi.useFakeTimers();
    const queue = new AgentQueue();
    const release = await queue.acquire();
    const waiting = queue.acquire(50);
    const assertion = expect(waiting).rejects.toBeInstanceOf(QueueTimeoutError);

    await vi.advanceTimersByTimeAsync(51);
    await assertion;
    expect(queue.snapshot()).toMatchObject({
      active: true,
      queued: 0,
    });

    release("ok");
    vi.useRealTimers();
  });

  it("counts a failed job without leaking the lock", async () => {
    const queue = new AgentQueue();

    await expect(
      queue.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(queue.snapshot()).toMatchObject({
      active: false,
      processed: 0,
      failed: 1,
    });
  });
});
