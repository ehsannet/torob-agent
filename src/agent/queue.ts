import type { AgentQueueSnapshot } from "@/lib/agent-types";

export class QueueTimeoutError extends Error {
  constructor(message = "درخواست در صف پردازش ماند.") {
    super(message);
    this.name = "QueueTimeoutError";
  }
}

export type QueueOutcome = "ok" | "error";
export type QueueRelease = (outcome?: QueueOutcome) => void;

type Waiter = {
  resolve: (release: QueueRelease) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  queuedAt: number;
};

export class AgentQueue {
  private active = false;
  private waiters: Waiter[] = [];
  private processed = 0;
  private failed = 0;
  private lastWaitMs: number | null = null;

  snapshot(): AgentQueueSnapshot {
    return {
      active: this.active,
      queued: this.waiters.length,
      processed: this.processed,
      failed: this.failed,
      lastWaitMs: this.lastWaitMs,
    };
  }

  async acquire(timeoutMs = 15_000): Promise<QueueRelease> {
    if (!this.active) {
      this.active = true;
      this.lastWaitMs = 0;
      return this.createRelease();
    }

    return new Promise<QueueRelease>((resolve, reject) => {
      const waiter: Waiter = {
        resolve,
        reject,
        queuedAt: Date.now(),
        timer: setTimeout(() => {
          const index = this.waiters.indexOf(waiter);
          if (index >= 0) this.waiters.splice(index, 1);
          reject(new QueueTimeoutError());
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  async run<T>(
    job: () => Promise<T>,
    timeoutMs = 15_000,
  ): Promise<T> {
    const release = await this.acquire(timeoutMs);
    try {
      const result = await job();
      release("ok");
      return result;
    } catch (error) {
      release("error");
      throw error;
    }
  }

  private createRelease(): QueueRelease {
    let released = false;
    return (outcome: QueueOutcome = "ok") => {
      if (released) return;
      released = true;

      if (outcome === "ok") this.processed += 1;
      else this.failed += 1;

      const next = this.waiters.shift();
      if (!next) {
        this.active = false;
        return;
      }

      clearTimeout(next.timer);
      this.lastWaitMs = Date.now() - next.queuedAt;
      next.resolve(this.createRelease());
    };
  }
}

const globalForQueue = globalThis as unknown as {
  __torobAgentQueue?: AgentQueue;
};

export const agentQueue =
  globalForQueue.__torobAgentQueue ?? new AgentQueue();

globalForQueue.__torobAgentQueue = agentQueue;
