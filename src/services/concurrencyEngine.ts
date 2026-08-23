/**
 * TradeosAi - Concurrency, Canvas Frame & Micro-Task Coalescing Engine
 * 
 * Protects trader workstations from:
 * 1. UI thread starvation during 09:15 AM IST high-frequency tick bursts (>50 ticks/sec)
 * 2. Canvas & chart re-rendering jitter using requestAnimationFrame (rAF) throttle
 * 3. Memory leaks from uncleaned event listeners and orphaned timers
 * 4. Offloads heavy risk calculations (drawdown matrices, multi-asset VAR) into non-blocking micro-tasks
 */

export interface MicroBatchTick {
  symbol: string;
  price: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp: number;
}

class ConcurrencyEngine {
  private pendingTickBatch: Map<string, MicroBatchTick> = new Map();
  private isBatchScheduled: boolean = false;
  private tickSubscribers: Set<(batch: Map<string, MicroBatchTick>) => void> = new Set();
  private canvasRenderRequests: Map<string, () => void> = new Map();
  private isRafActive: boolean = false;

  /**
   * Coalesces high-frequency market ticks into a synchronized 60fps micro-batch.
   * If BTC/NIFTY ticks 100 times in 1 second, it triggers at most 60 or 30 batched state dispatches,
   * completely eliminating React rendering churn and garbage collection spikes.
   */
  public enqueueTick(tick: MicroBatchTick) {
    this.pendingTickBatch.set(tick.symbol, tick);

    if (!this.isBatchScheduled) {
      this.isBatchScheduled = true;
      // Micro-task or rAF coalescing
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => this.flushTickBatch());
      } else {
        setTimeout(() => this.flushTickBatch(), 16);
      }
    }
  }

  private flushTickBatch() {
    this.isBatchScheduled = false;
    if (this.pendingTickBatch.size === 0) return;

    const snapshot = new Map(this.pendingTickBatch);
    this.pendingTickBatch.clear();

    for (const callback of this.tickSubscribers) {
      try {
        callback(snapshot);
      } catch (err) {
        console.error('[ConcurrencyEngine] Subscriber tick error:', err);
      }
    }
  }

  public subscribeToBatchedTicks(callback: (batch: Map<string, MicroBatchTick>) => void): () => void {
    this.tickSubscribers.add(callback);
    return () => {
      this.tickSubscribers.delete(callback);
    };
  }

  /**
   * Canvas / Chart Re-render Throttle
   * Ensures high-resolution candlestick canvas never draws more than once per screen refresh interval.
   */
  public requestCanvasRender(canvasId: string, drawFunction: () => void) {
    this.canvasRenderRequests.set(canvasId, drawFunction);

    if (!this.isRafActive) {
      this.isRafActive = true;
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          this.isRafActive = false;
          const renders = Array.from(this.canvasRenderRequests.values());
          this.canvasRenderRequests.clear();
          for (const render of renders) {
            try {
              render();
            } catch (err) {
              console.error('[ConcurrencyEngine] Canvas render failed:', err);
            }
          }
        });
      } else {
        this.isRafActive = false;
        drawFunction();
      }
    }
  }

  /**
   * Non-Blocking Async Micro-Task Chunking for Heavy Calculations
   * Splits multi-asset risk matrix calculations across event loop turns to prevent UI hangs.
   */
  public async computeHeavyRiskMetricsAsync<T, R>(
    items: T[],
    computeFn: (item: T) => R,
    chunkSize: number = 25
  ): Promise<R[]> {
    const results: R[] = [];
    let index = 0;

    return new Promise((resolve) => {
      function processChunk() {
        const end = Math.min(index + chunkSize, items.length);
        for (; index < end; index++) {
          results.push(computeFn(items[index]));
        }

        if (index < items.length) {
          // Yield to browser UI thread
          if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
            (window as any).requestIdleCallback(() => processChunk());
          } else {
            setTimeout(processChunk, 0);
          }
        } else {
          resolve(results);
        }
      }

      processChunk();
    });
  }
}

export const concurrencyEngine = new ConcurrencyEngine();
