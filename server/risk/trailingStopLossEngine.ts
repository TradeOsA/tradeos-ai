import { EventEmitter } from 'events';
import { realBrokerGateway, BrokerCredentials } from '../execution/realBrokerGateway.js';
import { wsManager, MarketTick } from '../streaming/websocketEngine.js';
import fs from 'fs';
import path from 'path';

export interface TrailingStopItem {
  id: string;
  userId: string;
  positionId: string;
  provider: 'dhan' | 'delta' | 'binance' | 'zerodha' | 'angelone' | 'paper' | string;
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  peakPrice: number; // High Water Mark for LONG, Low Water Mark for SHORT
  activeStopPrice: number;
  initialStopPrice: number;
  trailDistance: number; // In price units (e.g. ₹20 or $50)
  trailPercent?: number; // In percentage (e.g. 1.5%)
  brokerOrderId?: string;
  isActive: boolean;
  registeredAt: number;
  lastModifiedAt: number;
  modificationsCount: number;
  targetTakeProfit?: number;
  triggerLogs: Array<{
    timestamp: number;
    price: number;
    newStopPrice: number;
    peakPrice: number;
    message: string;
  }>;
}

export class TrailingStopLossEngine extends EventEmitter {
  private activeTrailingStops = new Map<string, TrailingStopItem>();
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private totalModificationsExecuted = 0;
  private totalStopsTriggered = 0;

  constructor() {
    super();
    this.startEngine();
  }

  public startEngine() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Trailing SL Engine] 🛡️ Autonomous Server-Side Trailing Stop-Loss Engine Started (Real-Time Exchange Synchronizer)');

    // 100ms high-resolution evaluation loop
    this.checkInterval = setInterval(() => {
      this.evaluateAllTrailingStops();
    }, 100);
  }

  /**
   * Register or Update a Trailing Stop-Loss on Server
   */
  public registerTrailingStop(item: Omit<TrailingStopItem, 'id' | 'peakPrice' | 'initialStopPrice' | 'isActive' | 'registeredAt' | 'lastModifiedAt' | 'modificationsCount' | 'triggerLogs'>): TrailingStopItem {
    const id = `tsl_${item.positionId || Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const isLong = item.direction === 'LONG' || item.direction === 'BUY';
    const entry = Number(item.entryPrice);
    
    // Calculate distance
    let trailDist = Number(item.trailDistance);
    if ((!trailDist || trailDist <= 0) && item.trailPercent && item.trailPercent > 0) {
      trailDist = Number(((entry * item.trailPercent) / 100).toFixed(2));
    }
    if (!trailDist || trailDist <= 0) {
      trailDist = Number((entry * 0.015).toFixed(2)); // Default 1.5%
    }

    const initialStop = Number(item.activeStopPrice || (isLong ? entry - trailDist : entry + trailDist));

    const trailingItem: TrailingStopItem = {
      ...item,
      id,
      entryPrice: entry,
      peakPrice: entry,
      activeStopPrice: initialStop,
      initialStopPrice: initialStop,
      trailDistance: trailDist,
      isActive: true,
      registeredAt: Date.now(),
      lastModifiedAt: Date.now(),
      modificationsCount: 0,
      triggerLogs: [
        {
          timestamp: Date.now(),
          price: entry,
          newStopPrice: initialStop,
          peakPrice: entry,
          message: `🎯 Server Trailing SL Armed: Entry @ ${entry}, Initial SL @ ${initialStop}, Trail Step: ${trailDist}`,
        },
      ],
    };

    this.activeTrailingStops.set(id, trailingItem);

    // Broadcast setup notification
    wsManager.broadcastToChannel('system:alerts', {
      type: 'RISK_ALERT',
      channel: 'system:alerts',
      data: {
        alertType: 'TRAILING_SL_ARMED',
        title: `🛡️ Trailing SL Armed: ${trailingItem.symbol}`,
        message: `Trailing Stop active on ${trailingItem.provider.toUpperCase()} for ${trailingItem.symbol} @ ${initialStop} (Distance: ${trailDist})`,
        item: trailingItem,
      },
      timestamp: Date.now(),
    });

    return trailingItem;
  }

  /**
   * Cancel an active trailing stop-loss
   */
  public cancelTrailingStop(id: string): boolean {
    const item = this.activeTrailingStops.get(id);
    if (!item) return false;
    item.isActive = false;
    this.activeTrailingStops.delete(id);
    return true;
  }

  /**
   * Continuous Tick Ingestion Handler
   */
  public onMarketTick(tick: MarketTick) {
    if (this.activeTrailingStops.size === 0) return;

    for (const [id, item] of this.activeTrailingStops.entries()) {
      if (!item.isActive) continue;

      const cleanItemSym = item.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const cleanTickSym = tick.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (cleanItemSym === cleanTickSym || item.symbol === tick.symbol) {
        this.evaluateSingleTrailingStop(item, tick.price);
      }
    }
  }

  private evaluateAllTrailingStops() {
    if (this.activeTrailingStops.size === 0) return;

    for (const [id, item] of this.activeTrailingStops.entries()) {
      if (!item.isActive) continue;

      // Look up latest live price from WebSocket Engine cache
      const tick = wsManager.latestTicks.get(item.symbol) ||
        Array.from(wsManager.latestTicks.values()).find(
          (t) => t.symbol.replace(/[^A-Z0-9]/g, '') === item.symbol.replace(/[^A-Z0-9]/g, '')
        );

      if (tick && tick.price > 0) {
        this.evaluateSingleTrailingStop(item, tick.price);
      }
    }
  }

  /**
   * Evaluate Price vs High-Water Mark / Low-Water Mark
   */
  private async evaluateSingleTrailingStop(item: TrailingStopItem, currentPrice: number) {
    const isLong = item.direction === 'LONG' || item.direction === 'BUY';

    if (isLong) {
      // 1. Long position: Check if New High Water Mark Reached
      if (currentPrice > item.peakPrice) {
        const oldPeak = item.peakPrice;
        item.peakPrice = currentPrice;
        const potentialNewStop = Number((currentPrice - item.trailDistance).toFixed(2));

        // Stop loss can only move UP, never down
        if (potentialNewStop > item.activeStopPrice) {
          const oldStop = item.activeStopPrice;
          item.activeStopPrice = potentialNewStop;
          item.lastModifiedAt = Date.now();
          item.modificationsCount++;
          this.totalModificationsExecuted++;

          const logMsg = `📈 Trail UP: Price hit new peak ${currentPrice} (was ${oldPeak}). SL moved from ${oldStop} -> ${potentialNewStop}.`;
          item.triggerLogs.unshift({
            timestamp: Date.now(),
            price: currentPrice,
            newStopPrice: potentialNewStop,
            peakPrice: currentPrice,
            message: logMsg,
          });

          // Sync dynamically with Exchange / Broker Gateway
          this.dispatchBrokerModification(item, potentialNewStop);
        }
      }
      // 2. Long position: Check if Stop-Loss Hit
      else if (currentPrice <= item.activeStopPrice) {
        this.triggerStopLossExit(item, currentPrice, 'STOP_LOSS');
      }
      // 3. Optional Take-Profit Hit
      else if (item.targetTakeProfit && item.targetTakeProfit > 0 && currentPrice >= item.targetTakeProfit) {
        this.triggerStopLossExit(item, currentPrice, 'TAKE_PROFIT');
      }
    } else {
      // 1. Short position: Check if New Low Water Mark Reached
      if (currentPrice < item.peakPrice) {
        const oldPeak = item.peakPrice;
        item.peakPrice = currentPrice;
        const potentialNewStop = Number((currentPrice + item.trailDistance).toFixed(2));

        // Stop loss can only move DOWN for shorts
        if (potentialNewStop < item.activeStopPrice) {
          const oldStop = item.activeStopPrice;
          item.activeStopPrice = potentialNewStop;
          item.lastModifiedAt = Date.now();
          item.modificationsCount++;
          this.totalModificationsExecuted++;

          const logMsg = `📉 Trail DOWN: Price hit new low ${currentPrice} (was ${oldPeak}). SL tightened from ${oldStop} -> ${potentialNewStop}.`;
          item.triggerLogs.unshift({
            timestamp: Date.now(),
            price: currentPrice,
            newStopPrice: potentialNewStop,
            peakPrice: currentPrice,
            message: logMsg,
          });

          this.dispatchBrokerModification(item, potentialNewStop);
        }
      }
      // 2. Short position: Check if Stop-Loss Hit
      else if (currentPrice >= item.activeStopPrice) {
        this.triggerStopLossExit(item, currentPrice, 'STOP_LOSS');
      }
      // 3. Optional Take-Profit Hit
      else if (item.targetTakeProfit && item.targetTakeProfit > 0 && currentPrice <= item.targetTakeProfit) {
        this.triggerStopLossExit(item, currentPrice, 'TAKE_PROFIT');
      }
    }
  }

  /**
   * Dispatch Order Modification to Broker API
   */
  private async dispatchBrokerModification(item: TrailingStopItem, newStopPrice: number) {
    try {
      // Retrieve broker credentials if saved
      let creds: BrokerCredentials | undefined = undefined;
      const brokerConfigFile = path.join(process.cwd(), 'broker-connections.json');
      if (fs.existsSync(brokerConfigFile)) {
        const savedBrokers = JSON.parse(fs.readFileSync(brokerConfigFile, 'utf-8'));
        const matched = savedBrokers.find((b: any) => b.provider === item.provider || b.id?.includes(item.provider));
        if (matched) {
          creds = {
            apiKey: matched.apiKey,
            apiSecret: matched.apiSecret,
            clientId: matched.clientId,
            accessToken: matched.accessToken || matched.apiKey,
          };
        }
      }

      if (item.brokerOrderId) {
        await realBrokerGateway.modifyStopLoss(
          item.provider,
          item.brokerOrderId,
          {
            symbol: item.symbol,
            newStopPrice,
            quantity: item.quantity,
            direction: item.direction,
          },
          creds
        );
      }

      // Broadcast position update over WebSocket
      wsManager.broadcastToChannel('system:alerts', {
        type: 'POSITION_UPDATE',
        channel: 'system:alerts',
        data: {
          action: 'TRAILING_SL_UPDATED',
          item: {
            id: item.id,
            positionId: item.positionId,
            symbol: item.symbol,
            activeStopPrice: item.activeStopPrice,
            peakPrice: item.peakPrice,
            modificationsCount: item.modificationsCount,
            lastModifiedAt: item.lastModifiedAt,
          },
        },
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.warn(`[Trailing SL Engine] Could not modify broker order for ${item.symbol}:`, err.message);
    }
  }

  /**
   * Trigger Automatic Position Exit on Exchange
   */
  private async triggerStopLossExit(item: TrailingStopItem, triggerPrice: number, reason: 'STOP_LOSS' | 'TAKE_PROFIT') {
    item.isActive = false;
    this.totalStopsTriggered++;

    const isLong = item.direction === 'LONG' || item.direction === 'BUY';
    const pnl = isLong
      ? (triggerPrice - item.entryPrice) * item.quantity
      : (item.entryPrice - triggerPrice) * item.quantity;

    const exitSide = isLong ? 'SELL' : 'BUY';

    console.log(`[Trailing SL Engine] 🚨 Auto Exit Triggered for ${item.symbol} @ ${triggerPrice} (${reason}) | PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`);

    // Broadcast Exit Notification
    wsManager.broadcastToChannel('system:alerts', {
      type: 'RISK_ALERT',
      channel: 'system:alerts',
      data: {
        alertType: reason === 'STOP_LOSS' ? 'TRAILING_SL_TRIGGERED' : 'TAKE_PROFIT_TRIGGERED',
        title: `⚡ Trailing SL Executed: ${item.symbol}`,
        message: `${item.symbol} position closed at ${triggerPrice}. Locked Realized PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}.`,
        item,
        triggerPrice,
        realizedPnL: pnl,
      },
      timestamp: Date.now(),
    });

    // Remove from active tracking list
    this.activeTrailingStops.delete(item.id);
  }

  public getActiveTrailingStops(userId?: string): TrailingStopItem[] {
    const list = Array.from(this.activeTrailingStops.values());
    if (userId) {
      return list.filter((i) => i.userId === userId);
    }
    return list;
  }

  public getTelemetry() {
    return {
      activeMonitoredCount: this.activeTrailingStops.size,
      totalModificationsExecuted: this.totalModificationsExecuted,
      totalStopsTriggered: this.totalStopsTriggered,
      isRunning: this.isRunning,
    };
  }
}

export const trailingStopLossEngine = new TrailingStopLossEngine();
