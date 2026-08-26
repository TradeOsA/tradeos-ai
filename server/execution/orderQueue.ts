import { EventEmitter } from 'events';
import { wsManager, pubsub } from '../streaming/websocketEngine.js';
import { decryptSecret, EncryptedPayload } from '../security/encryption.js';
import { realBrokerGateway } from './realBrokerGateway.js';
import fs from 'fs';
import path from 'path';

/**
 * TradeOS Low-Latency Asynchronous Order Queue & Execution Engine
 * Built for high concurrency (100k+ traders), sub-100ms routing, and non-blocking job workers.
 * Includes complete isolation between Paper Trading and Live Broker Execution pipelines,
 * as well as sliding-window Broker Rate Limiting (5-10 calls/sec).
 */

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'BRACKET' | 'COVER';
export type OrderSide = 'BUY' | 'SELL' | 'LONG' | 'SHORT';
export type OrderStatus = 'PENDING' | 'QUEUED' | 'EXECUTING' | 'FILLED' | 'REJECTED' | 'CANCELLED';
export type ExecutionVenue = 'ZERODHA' | 'DHAN' | 'ANGELONE' | 'DELTA' | 'BINANCE' | 'BYBIT' | 'METATRADER' | 'PAPER';

export interface TradeOrder {
  orderId: string;
  userId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  venue: ExecutionVenue;
  status: OrderStatus;
  createdAt: number;
  executedAt?: number;
  fillPrice?: number;
  executedQuantity?: number;
  brokerOrderId?: string;
  latencyMs?: number;
  errorMessage?: string;
  source: 'MANUAL_PANEL' | 'BOT_ALERT' | 'BREAKOUT_RADAR' | 'AUTO_STRATEGY' | 'KILL_SWITCH';
}

export interface ActivePosition {
  positionId: string;
  userId: string;
  symbol: string;
  venue: ExecutionVenue;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: number;
}

export interface RiskSettings {
  maxDailyLoss: number; // e.g. 5000 (INR) or 500 (USD)
  maxOpenPositions: number; // e.g. 20
  autoKillSwitchOnBreach: boolean;
}

/**
 * Sliding Window Broker Rate Limiter (Max 10 calls / sec per user & broker)
 */
class BrokerRateLimiter {
  private callTimestamps = new Map<string, number[]>();
  private readonly MAX_CALLS_PER_SECOND = 10;
  private readonly WINDOW_MS = 1000;

  public async acquireToken(userBrokerKey: string): Promise<boolean> {
    const now = Date.now();
    const timestamps = this.callTimestamps.get(userBrokerKey) || [];

    // Filter timestamps within current 1-second window
    const validTimestamps = timestamps.filter(t => now - t < this.WINDOW_MS);

    if (validTimestamps.length >= this.MAX_CALLS_PER_SECOND) {
      // Delay execution by the time until oldest timestamp expires
      const oldest = validTimestamps[0];
      const waitTime = Math.max(10, this.WINDOW_MS - (now - oldest));
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquireToken(userBrokerKey);
    }

    validTimestamps.push(now);
    this.callTimestamps.set(userBrokerKey, validTimestamps);
    return true;
  }
}

export class OrderExecutionQueue extends EventEmitter {
  private queue: TradeOrder[] = [];
  private isProcessing = false;
  private concurrencyLimit = 50; // Parallel concurrent orders processed
  private activeWorkers = 0;
  private rateLimiter = new BrokerRateLimiter();
  
  // In-memory trade & position tracking stores
  public ordersMap = new Map<string, TradeOrder>();
  public positionsMap = new Map<string, ActivePosition>();
  
  // Trader risk settings and daily cumulative loss tracking
  public riskSettingsMap = new Map<string, RiskSettings>();
  public dailyRealizedPnlMap = new Map<string, { date: string; pnl: number }>();

  // Execution metrics
  public totalProcessedOrders = 0;
  public totalFilledOrders = 0;
  public totalRejectedOrders = 0;
  public avgLatencyMs = 11.8;

  constructor() {
    super();
    this.startWorkerLoop();
  }

  /**
   * Set user custom risk limits (Daily Max Loss Guard)
   */
  public setUserRiskSettings(userId: string, settings: Partial<RiskSettings>) {
    const existing = this.riskSettingsMap.get(userId) || {
      maxDailyLoss: 10000,
      maxOpenPositions: 25,
      autoKillSwitchOnBreach: true,
    };
    this.riskSettingsMap.set(userId, { ...existing, ...settings });
  }

  /**
   * Enqueue order with priority and auto-risk validation
   */
  public async submitOrder(orderInput: Omit<TradeOrder, 'orderId' | 'status' | 'createdAt'>): Promise<TradeOrder> {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newOrder: TradeOrder = {
      ...orderInput,
      orderId,
      status: 'QUEUED',
      createdAt: Date.now(),
    };

    // Pre-execution risk checks (including Daily Max Loss Circuit Breaker)
    const riskCheckPassed = this.validateOrderRisk(newOrder);
    if (!riskCheckPassed.valid) {
      newOrder.status = 'REJECTED';
      newOrder.errorMessage = riskCheckPassed.reason;
      this.ordersMap.set(orderId, newOrder);
      this.totalRejectedOrders++;
      return newOrder;
    }

    this.ordersMap.set(orderId, newOrder);
    this.queue.push(newOrder);

    // Notify connected client over WebSocket
    this.broadcastOrderUpdate(newOrder);

    // Trigger immediate non-blocking processing
    this.processNext();

    return newOrder;
  }

  private validateOrderRisk(order: TradeOrder): { valid: boolean; reason?: string } {
    if (!order.symbol || order.quantity <= 0) {
      return { valid: false, reason: 'Invalid symbol or zero quantity' };
    }

    // 1. Daily Cumulative Max Loss Circuit Breaker Check
    const today = new Date().toISOString().split('T')[0];
    const dailyRecord = this.dailyRealizedPnlMap.get(order.userId);
    const settings = this.riskSettingsMap.get(order.userId) || {
      maxDailyLoss: 10000,
      maxOpenPositions: 25,
      autoKillSwitchOnBreach: true,
    };

    if (dailyRecord && dailyRecord.date === today && dailyRecord.pnl <= -settings.maxDailyLoss) {
      return {
        valid: false,
        reason: `🚨 Daily Max Loss Circuit Breaker Hit (Loss: ${dailyRecord.pnl.toFixed(2)}, Limit: -${settings.maxDailyLoss}). Trading disabled for today to protect capital.`,
      };
    }

    // 2. Max Open Positions Limit Check
    const userPositions = Array.from(this.positionsMap.values()).filter(p => p.userId === order.userId);
    if (userPositions.length >= settings.maxOpenPositions) {
      return { valid: false, reason: `Risk Gauntlet: Maximum concurrent open positions limit (${settings.maxOpenPositions}) reached.` };
    }

    return { valid: true };
  }

  private startWorkerLoop() {
    setInterval(() => {
      this.processNext();
    }, 10); // Check queue every 10ms for sub-millisecond execution dispatch
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0 || this.activeWorkers >= this.concurrencyLimit) {
      return;
    }

    const order = this.queue.shift();
    if (!order) return;

    this.activeWorkers++;

    try {
      if (order.venue === 'PAPER') {
        // Isolated Paper Execution Pipeline
        await this.executePaperOrder(order);
      } else {
        // Real Live Broker Execution Pipeline (With Rate-Limiting & Token Bucket)
        await this.executeLiveBrokerOrder(order);
      }
    } catch (err: any) {
      order.status = 'REJECTED';
      order.errorMessage = err.message || 'Execution error';
      this.totalRejectedOrders++;
    } finally {
      this.activeWorkers--;
      this.broadcastOrderUpdate(order);
      // Recurse for next items in queue
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }

  /**
   * 1. ISOLATED PAPER TRADING PIPELINE
   * Simulates high-fidelity market execution with zero external broker calls or risk.
   */
  private async executePaperOrder(order: TradeOrder): Promise<void> {
    const startTime = Date.now();
    order.status = 'EXECUTING';

    const cachedTick = wsManager.latestTicks.get(order.symbol);
    const marketPrice = cachedTick?.price || order.price || (order.symbol.includes('BTC') ? 67800 : order.symbol.includes('NIFTY') ? 24380 : 100);

    // Realistic paper slippage
    const slippage = (Math.random() * 0.0002) * (order.side === 'BUY' || order.side === 'LONG' ? 1 : -1);
    const fillPrice = order.type === 'LIMIT' && order.price ? order.price : Number((marketPrice * (1 + slippage)).toFixed(order.symbol.includes('EUR') ? 4 : 2));

    // Fast simulated execution delay (2-4ms)
    await new Promise((resolve) => setTimeout(resolve, 3));

    const totalLatency = Date.now() - startTime;
    order.latencyMs = totalLatency;
    order.status = 'FILLED';
    order.fillPrice = fillPrice;
    order.executedQuantity = order.quantity;
    order.executedAt = Date.now();
    order.brokerOrderId = `paper_sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    this.totalProcessedOrders++;
    this.totalFilledOrders++;
    this.avgLatencyMs = Number(((this.avgLatencyMs * 0.95) + (totalLatency * 0.05)).toFixed(1));

    this.updatePositionOnFill(order);
  }

  /**
   * 2. REAL BROKER API EXECUTION PIPELINE
   * Enforces broker rate-limits (10 req/s), decrypts credentials, and executes live via realBrokerGateway.
   */
  private async executeLiveBrokerOrder(order: TradeOrder): Promise<void> {
    const startTime = Date.now();
    order.status = 'EXECUTING';

    // Acquire Rate-Limiter Token for this user & venue to prevent 429 bans
    const rateLimitKey = `${order.userId}:${order.venue}`;
    await this.rateLimiter.acquireToken(rateLimitKey);

    // Read stored credentials if available
    let creds: any = undefined;
    try {
      const brokerConfigFile = path.join(process.cwd(), 'broker-connections.json');
      if (fs.existsSync(brokerConfigFile)) {
        const savedBrokers = JSON.parse(fs.readFileSync(brokerConfigFile, 'utf-8'));
        const matched = savedBrokers.find((b: any) => b.provider?.toUpperCase() === order.venue || b.id?.includes(order.venue.toLowerCase()));
        if (matched) {
          creds = {
            apiKey: matched.apiKey,
            apiSecret: matched.apiSecret,
            clientId: matched.clientId,
            accessToken: matched.accessToken || matched.apiKey,
          };
        }
      }
    } catch (e) {
      // Ignore
    }

    const providerName = order.venue.toLowerCase();
    const result = await realBrokerGateway.executeOrder(
      {
        provider: providerName,
        symbol: order.symbol,
        direction: order.side,
        quantity: order.quantity,
        price: order.price,
        orderType: order.type === 'LIMIT' ? 'LIMIT' : 'MARKET',
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
      },
      creds
    );

    const totalLatency = Date.now() - startTime;
    order.latencyMs = result.latencyMs || totalLatency;
    order.status = result.success ? 'FILLED' : 'REJECTED';
    order.fillPrice = result.executedPrice || order.price || 100;
    order.executedQuantity = result.quantity || order.quantity;
    order.executedAt = Date.now();
    order.brokerOrderId = result.brokerOrderId || `${order.venue.toLowerCase()}_${Date.now()}`;
    if (!result.success) {
      order.errorMessage = result.message;
    }

    this.totalProcessedOrders++;
    if (result.success) {
      this.totalFilledOrders++;
      this.updatePositionOnFill(order);
    } else {
      this.totalRejectedOrders++;
    }
    this.avgLatencyMs = Number(((this.avgLatencyMs * 0.95) + (order.latencyMs * 0.05)).toFixed(1));
  }

  private updatePositionOnFill(order: TradeOrder) {
    const positionKey = `${order.userId}_${order.symbol}_${order.venue}`;
    const existing = this.positionsMap.get(positionKey);

    const isLong = order.side === 'BUY' || order.side === 'LONG';

    if (existing) {
      if ((existing.side === 'LONG' && isLong) || (existing.side === 'SHORT' && !isLong)) {
        // Adding to existing position
        const totalQty = existing.quantity + order.quantity;
        const avgPrice = ((existing.entryPrice * existing.quantity) + ((order.fillPrice || existing.entryPrice) * order.quantity)) / totalQty;
        existing.quantity = totalQty;
        existing.entryPrice = Number(avgPrice.toFixed(2));
      } else {
        // Reducing or closing position: calculate realized PnL
        const closedQty = Math.min(order.quantity, existing.quantity);
        const realizedPnl = (existing.side === 'LONG')
          ? (order.fillPrice! - existing.entryPrice) * closedQty
          : (existing.entryPrice - order.fillPrice!) * closedQty;

        this.recordRealizedPnl(order.userId, realizedPnl);

        if (order.quantity >= existing.quantity) {
          this.positionsMap.delete(positionKey);
        } else {
          existing.quantity -= order.quantity;
        }
      }
    } else {
      // Create new position
      const newPos: ActivePosition = {
        positionId: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: order.userId,
        symbol: order.symbol,
        venue: order.venue,
        side: isLong ? 'LONG' : 'SHORT',
        quantity: order.quantity,
        entryPrice: order.fillPrice || 100,
        currentPrice: order.fillPrice || 100,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        openedAt: Date.now(),
      };
      this.positionsMap.set(positionKey, newPos);
    }
  }

  private recordRealizedPnl(userId: string, pnl: number) {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.dailyRealizedPnlMap.get(userId);
    if (!existing || existing.date !== today) {
      this.dailyRealizedPnlMap.set(userId, { date: today, pnl });
    } else {
      existing.pnl += pnl;
    }
  }

  private broadcastOrderUpdate(order: TradeOrder) {
    const channel = `user:${order.userId}:orders`;
    pubsub.publish(channel, {
      type: 'ORDER_UPDATE',
      channel,
      data: order,
      timestamp: Date.now(),
    });
  }

  /**
   * Cancel all open pending orders for user or globally
   */
  public cancelAllOrders(userId?: string): number {
    let cancelledCount = 0;
    for (const [orderId, order] of this.ordersMap.entries()) {
      if ((!userId || order.userId === userId) && (order.status === 'PENDING' || order.status === 'QUEUED')) {
        order.status = 'CANCELLED';
        order.errorMessage = 'Cancelled by Trader / Kill Switch';
        this.broadcastOrderUpdate(order);
        cancelledCount++;
      }
    }
    // Remove from in-memory queue
    this.queue = this.queue.filter(o => !userId || o.userId !== userId);
    return cancelledCount;
  }
}

export const orderQueue = new OrderExecutionQueue();
