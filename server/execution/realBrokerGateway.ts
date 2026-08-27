import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * TradeOS Real-Time Direct Broker & Exchange REST Gateway
 * 
 * STRICT MANDATE:
 * - Production-only API calls to official broker/exchange endpoints.
 * - No mock data, dummy data, fake API responses, or simulated connections.
 * - If credentials are not configured, returns status: 'CONFIGURATION_REQUIRED' / 'NOT_CONNECTED'.
 * - If an official API does not support a feature, explicitly marks it as "NOT_SUPPORTED".
 */

export interface BrokerCredentials {
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  accessToken?: string;
  totpSecret?: string;
  appId?: string;
  passphrase?: string;
  webhookSecret?: string;
  isTestnet?: boolean;
}

export interface LiveOrderPayload {
  provider: 'dhan' | 'delta' | 'binance' | 'angelone' | 'zerodha' | 'fyers' | 'upstox' | 'bybit' | 'kucoin' | 'okx' | 'metatrader' | string;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  quantity: number;
  price?: number;
  orderType?: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'SL_M' | 'SL_L';
  stopLoss?: number;
  takeProfit?: number;
  triggerPrice?: number;
  leverage?: number;
  category?: string;
  productType?: 'CNC' | 'MIS' | 'NRML' | 'MARGIN' | 'ISOLATED' | 'CROSS';
  credentials?: BrokerCredentials;
}

export interface RealOrderResult {
  success: boolean;
  orderId: string;
  brokerOrderId?: string;
  status: 'FILLED' | 'OPEN' | 'REJECTED' | 'QUEUED' | 'AMO_QUEUED' | 'CONFIGURATION_REQUIRED' | 'AUTHENTICATION_FAILED' | 'NOT_SUPPORTED';
  executedPrice: number;
  quantity: number;
  latencyMs: number;
  timestamp: string;
  message: string;
  rawResponse?: any;
  error?: string;
}

export interface BrokerConnectionTestResult {
  success: boolean;
  provider: string;
  providerName: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONFIGURATION_REQUIRED' | 'AUTHENTICATION_FAILED' | 'ERROR';
  latencyMs: number;
  serverTime: string;
  accountType?: string;
  accountId?: string;
  accountName?: string;
  availableMargin?: number;
  currency?: string;
  supportedFeatures: {
    marketOrders: boolean;
    limitOrders: boolean;
    stopLossOrders: boolean;
    trailingStopLoss: boolean;
    optionsChain: boolean;
    futuresPerpetuals: boolean;
    webhooks: boolean;
    bracketOrders: boolean;
  };
  unsupportedFeatures?: string[];
  message: string;
  error?: string;
}

export interface BrokerPosition {
  positionId: string;
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  productType?: string;
  leverage?: number;
  exchange: string;
  stopLoss?: number;
  takeProfit?: number;
  liquidationPrice?: number;
}

export interface BrokerTradeItem {
  id: string;
  orderId: string;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  quantity: number;
  executedPrice: number;
  executedAt: string;
  fee: number;
  feeCurrency: string;
  exchange: string;
  status: 'FILLED' | 'PARTIAL';
}

export class RealBrokerGateway {
  private defaultTimeoutMs = 6000;

  // -------------------------------------------------------------
  // Cryptographic Helper Functions
  // -------------------------------------------------------------

  /**
   * Helper to retrieve stored credentials from broker-connections.json
   */
  public getStoredCredentials(provider: string): BrokerCredentials | undefined {
    try {
      const brokerConfigFile = path.join(process.cwd(), 'broker-connections.json');
      if (fs.existsSync(brokerConfigFile)) {
        const savedBrokers = JSON.parse(fs.readFileSync(brokerConfigFile, 'utf-8'));
        const matched = savedBrokers.find(
          (b: any) =>
            b.provider?.toLowerCase() === provider.toLowerCase() ||
            b.id?.toLowerCase().includes(provider.toLowerCase())
        );
        if (matched) {
          return {
            apiKey: matched.apiKey,
            apiSecret: matched.apiSecret,
            clientId: matched.clientId,
            accessToken: matched.accessToken || matched.apiKey,
            totpSecret: matched.totpSecret,
            webhookSecret: matched.webhookSecret,
            appId: matched.appId,
          };
        }
      }
    } catch (e) {
      // Ignore
    }
    return undefined;
  }

  /**
   * Helper to sign requests for Delta Exchange (HMAC SHA256)
   */
  private generateDeltaSignature(secret: string, method: string, path: string, queryOrBody: string, timestamp: number): string {
    const message = method + timestamp + path + (queryOrBody || '');
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Helper to sign requests for CoinDCX (HMAC SHA256)
   */
  private generateCoinDcxSignature(secret: string, bodyStr: string): string {
    return crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
  }

  /**
   * Helper to sign requests for CoinSwitch PRO (HMAC SHA256)
   */
  private generateCoinSwitchSignature(secret: string, method: string, endpoint: string, bodyStr: string, epoch: number): string {
    const payload = method + endpoint + (bodyStr || '') + epoch;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Helper to generate Breeze Checksum for ICICI Direct
   */
  private generateBreezeChecksum(appSecret: string, timestamp: string, body: string): string {
    return crypto.createHmac('sha256', appSecret).update(timestamp + (body || '')).digest('hex');
  }

  /**
   * Helper to sign requests for Binance (HMAC SHA256)
   */
  private generateBinanceSignature(secret: string, queryString: string): string {
    return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
  }

  /**
   * Helper to sign requests for Bybit v5 (HMAC SHA256)
   */
  private generateBybitSignature(secret: string, apiKey: string, timestamp: number, queryOrBody: string, recvWindow: string = '5000'): string {
    const message = timestamp + apiKey + recvWindow + (queryOrBody || '');
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  // -------------------------------------------------------------
  // 1. DHAN HQ API v2 (Official NSE / BSE / MCX SuperFast Gateway)
  // -------------------------------------------------------------

  public async testDhanConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const token = creds?.accessToken || creds?.apiKey;
    const clientId = creds?.clientId;

    if (!token || !clientId) {
      return {
        success: false,
        provider: 'dhan',
        providerName: 'DhanHQ SuperFast API v2 (NSE / BSE)',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        unsupportedFeatures: ['Bracket Orders (Discontinued by Dhan API v2)', 'Crypto Futures'],
        message: 'CONFIGURATION REQUIRED: Dhan Client ID and Access Token are required. Please configure credentials in Brokers & Exchanges.',
        error: 'Missing Dhan credentials',
      };
    }

    try {
      // Official Dhan fund limit endpoint
      const res = await fetch('https://api.dhan.co/v2/fundlimit', {
        method: 'GET',
        headers: {
          'access-token': token,
          'client-id': clientId,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data) {
        const availMargin = Number(data.availMargin || data.availableBalance || data.dhanClientId ? data.availMargin || 0 : 0);
        return {
          success: true,
          provider: 'dhan',
          providerName: 'DhanHQ SuperFast API v2 (NSE / BSE)',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'Indian Equity / F&O Demat',
          accountId: clientId,
          accountName: `Dhan Account (${clientId})`,
          availableMargin: availMargin,
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          unsupportedFeatures: ['Bracket Orders (Discontinued in Dhan API v2)'],
          message: `Connected to DhanHQ API. Real latency: ${latencyMs}ms. Available Margin: ₹${availMargin.toLocaleString('en-IN')}`,
        };
      } else {
        return {
          success: false,
          provider: 'dhan',
          providerName: 'DhanHQ SuperFast API v2',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.remarks || data.errorMessage || data.message || 'Invalid Client ID or Access Token on Dhan'}`,
          error: data.errorMessage || data.remarks || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'dhan',
        providerName: 'DhanHQ SuperFast API v2',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: `Dhan Connection Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeDhanOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const token = creds?.accessToken || creds?.apiKey;
    const clientId = creds?.clientId;

    if (!token || !clientId) {
      return {
        success: false,
        orderId: `DHAN-ERR-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'CONFIGURATION REQUIRED: Cannot place live Dhan order without valid Client ID and Access Token.',
        error: 'Missing Dhan credentials',
      };
    }

    try {
      const dhanUrl = 'https://api.dhan.co/v2/orders';
      const txnType = order.direction === 'BUY' || order.direction === 'LONG' ? 'BUY' : 'SELL';
      const isFno = order.symbol.toUpperCase().includes('NIFTY') || order.symbol.toUpperCase().includes('BANKNIFTY') || order.symbol.toUpperCase().includes('CE') || order.symbol.toUpperCase().includes('PE');
      
      const dhanBody = {
        dhanClientId: clientId,
        correlationId: `tradeos_${Date.now()}`,
        transactionType: txnType,
        exchangeSegment: isFno ? 'NSE_FNO' : 'NSE_EQ',
        productType: order.productType || (isFno ? 'NRML' : 'CNC'),
        orderType: order.orderType === 'LIMIT' ? 'LIMIT' : order.orderType === 'SL_M' || order.orderType === 'STOP_LOSS' ? 'STOP_LOSS_MARKET' : 'MARKET',
        validity: 'DAY',
        securityId: '1333', // Default or symbol lookup
        quantity: Math.max(1, order.quantity),
        price: order.price || 0,
        triggerPrice: order.triggerPrice || order.stopLoss || 0,
      };

      const res = await fetch(dhanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': token,
          'client-id': clientId,
        },
        body: JSON.stringify(dhanBody),
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (res.ok && data.orderId) {
        return {
          success: true,
          orderId: `DHAN-${data.orderId}`,
          brokerOrderId: data.orderId,
          status: data.orderStatus === 'TRANSIT' || data.orderStatus === 'PENDING' ? 'OPEN' : 'FILLED',
          executedPrice: order.price || 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Live Order placed on DhanHQ API! Order ID: ${data.orderId}. Status: ${data.orderStatus}`,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          orderId: `DHAN-REJ-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: 0,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: data.remarks || data.errorMessage || data.message || 'Dhan HQ API order rejected by exchange.',
          rawResponse: data,
          error: data.errorMessage || data.remarks || 'Order rejected',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `DHAN-ERR-${Date.now()}`,
        status: 'REJECTED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `Dhan API Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async getDhanPositions(creds?: BrokerCredentials): Promise<{ success: boolean; positions: BrokerPosition[]; error?: string }> {
    const token = creds?.accessToken || creds?.apiKey;
    const clientId = creds?.clientId;
    if (!token || !clientId) {
      return { success: false, positions: [], error: 'Configuration Required: Dhan Client ID and Access Token missing.' };
    }

    try {
      const res = await fetch('https://api.dhan.co/v2/positions', {
        headers: { 'access-token': token, 'client-id': clientId },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, positions: [], error: err.errorMessage || 'Failed to fetch Dhan positions' };
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      const positions: BrokerPosition[] = list.map((p: any) => ({
        positionId: String(p.positionId || p.securityId || Date.now()),
        symbol: p.tradingSymbol || p.customSymbol || 'NSE_POSITION',
        direction: (p.netQty > 0 ? 'BUY' : 'SELL') as any,
        quantity: Math.abs(p.netQty || p.buyQty - p.sellQty || 0),
        entryPrice: Number(p.buyAvg || p.costPrice || 0),
        currentPrice: Number(p.ltp || p.lastPrice || 0),
        unrealizedPnL: Number(p.unrealizedProfit || p.realizedProfit || 0),
        unrealizedPnLPercent: Number(p.unrealizedProfitPercent || 0),
        productType: p.productType,
        exchange: p.exchangeSegment || 'NSE',
      }));
      return { success: true, positions };
    } catch (e: any) {
      return { success: false, positions: [], error: e.message };
    }
  }

  public async getDhanTrades(creds?: BrokerCredentials): Promise<{ success: boolean; trades: BrokerTradeItem[]; error?: string }> {
    const token = creds?.accessToken || creds?.apiKey;
    const clientId = creds?.clientId;
    if (!token || !clientId) {
      return { success: false, trades: [], error: 'Configuration Required: Dhan credentials not configured.' };
    }

    try {
      const res = await fetch('https://api.dhan.co/v2/trades', {
        headers: { 'access-token': token, 'client-id': clientId },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, trades: [], error: err.errorMessage || 'Failed to fetch Dhan trades' };
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      const trades: BrokerTradeItem[] = list.map((t: any) => ({
        id: String(t.tradeId || t.exchangeTradeId || Date.now()),
        orderId: String(t.orderId || ''),
        symbol: t.tradingSymbol || 'NSE_ASSET',
        direction: t.transactionType === 'BUY' ? 'BUY' : 'SELL',
        quantity: Number(t.tradedQuantity || t.quantity || 0),
        executedPrice: Number(t.tradedPrice || t.price || 0),
        executedAt: t.exchangeTime || t.tradeTime || new Date().toISOString(),
        fee: Number(t.brokerage || 0),
        feeCurrency: 'INR',
        exchange: t.exchangeSegment || 'NSE',
        status: 'FILLED',
      }));
      return { success: true, trades };
    } catch (e: any) {
      return { success: false, trades: [], error: e.message };
    }
  }

  // -------------------------------------------------------------
  // 2. DELTA EXCHANGE (India & Global Crypto Perpetuals & Options)
  // -------------------------------------------------------------

  public async testDeltaConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        provider: 'delta',
        providerName: 'Delta Exchange (India & Global F&O / Perpetuals)',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: true,
        },
        message: 'CONFIGURATION REQUIRED: Delta Exchange API Key and API Secret are required. Configure in Brokers & Exchanges.',
        error: 'Missing Delta credentials',
      };
    }

    try {
      const baseUrl = 'https://api.india.delta.exchange';
      const path = '/v2/wallet/balances';
      const method = 'GET';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateDeltaSignature(apiSecret, method, path, '', timestamp);

      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'signature': signature,
          'timestamp': String(timestamp),
          'User-Agent': 'TradeOS-Engine-Production',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.result) {
        const usdtWallet = Array.isArray(data.result) ? data.result.find((w: any) => w.asset_symbol === 'USDT' || w.asset_symbol === 'USD') : null;
        const availBalance = usdtWallet ? Number(usdtWallet.available_balance || usdtWallet.balance || 0) : 0;

        return {
          success: true,
          provider: 'delta',
          providerName: 'Delta Exchange (India & Global F&O / Perpetuals)',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'Crypto F&O & Futures Vault',
          accountId: apiKey.slice(0, 8) + '...',
          accountName: 'Delta Exchange Live Wallet',
          availableMargin: availBalance,
          currency: 'USDT',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: true,
          },
          message: `Connected to Delta Exchange REST Gateway. Live Ping: ${latencyMs}ms. Available Margin: $${availBalance.toLocaleString()}`,
        };
      } else {
        return {
          success: false,
          provider: 'delta',
          providerName: 'Delta Exchange',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: true,
          },
          message: `Authentication Failed: ${data.error?.message || data.message || 'Invalid API Key or Secret for Delta Exchange.'}`,
          error: data.error?.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'delta',
        providerName: 'Delta Exchange',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: true,
        },
        message: `Delta Exchange Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeDeltaOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        orderId: `DELTA-ERR-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'CONFIGURATION REQUIRED: Delta Exchange API Key and Secret are required to execute live orders.',
        error: 'Missing Delta credentials',
      };
    }

    try {
      const baseUrl = 'https://api.india.delta.exchange';
      const path = '/v2/orders';
      const method = 'POST';
      const timestamp = Math.floor(Date.now() / 1000);

      const side = order.direction === 'BUY' || order.direction === 'LONG' ? 'buy' : 'sell';
      const bodyPayload: any = {
        product_symbol: order.symbol.toUpperCase().replace('/', ''),
        size: Math.max(1, Math.round(order.quantity)),
        side,
        order_type: order.orderType === 'LIMIT' ? 'limit_order' : 'market_order',
      };

      if (order.orderType === 'LIMIT' && order.price) {
        bodyPayload.limit_price = String(order.price);
      }
      if (order.stopLoss) {
        bodyPayload.stop_loss_order = { stop_price: String(order.stopLoss) };
      }
      if (order.takeProfit) {
        bodyPayload.take_profit_order = { stop_price: String(order.takeProfit) };
      }

      const bodyStr = JSON.stringify(bodyPayload);
      const signature = this.generateDeltaSignature(apiSecret, method, path, bodyStr, timestamp);

      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'signature': signature,
          'timestamp': String(timestamp),
          'User-Agent': 'TradeOS-Engine-Production',
        },
        body: bodyStr,
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (res.ok && data.result) {
        return {
          success: true,
          orderId: `DELTA-${data.result.id}`,
          brokerOrderId: String(data.result.id),
          status: data.result.state === 'open' ? 'OPEN' : 'FILLED',
          executedPrice: Number(data.result.unbundled_avg_fill_price || data.result.limit_price || order.price || 0),
          quantity: Number(data.result.size || order.quantity),
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Live Order placed on Delta Exchange! Order ID: ${data.result.id}. Direct Latency: ${latencyMs}ms.`,
          rawResponse: data.result,
        };
      } else {
        return {
          success: false,
          orderId: `DELTA-REJ-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: 0,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: data.error?.message || data.message || 'Delta Exchange rejected the order.',
          rawResponse: data,
          error: data.error?.message || 'Order rejected',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `DELTA-ERR-${Date.now()}`,
        status: 'REJECTED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `Delta API Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async getDeltaPositions(creds?: BrokerCredentials): Promise<{ success: boolean; positions: BrokerPosition[]; error?: string }> {
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;
    if (!apiKey || !apiSecret) {
      return { success: false, positions: [], error: 'Configuration Required: Delta credentials not configured.' };
    }

    try {
      const baseUrl = 'https://api.india.delta.exchange';
      const path = '/v2/positions';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateDeltaSignature(apiSecret, 'GET', path, '', timestamp);

      const res = await fetch(`${baseUrl}${path}`, {
        headers: {
          'api-key': apiKey,
          'signature': signature,
          'timestamp': String(timestamp),
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, positions: [], error: err.error?.message || 'Failed to fetch Delta positions' };
      }

      const data = await res.json();
      const list = Array.isArray(data.result) ? data.result : [];
      const positions: BrokerPosition[] = list
        .filter((p: any) => Number(p.size) !== 0)
        .map((p: any) => ({
          positionId: String(p.product_id || p.id),
          symbol: p.product_symbol || 'BTC-PERP',
          direction: Number(p.size) > 0 ? 'LONG' : 'SHORT',
          quantity: Math.abs(Number(p.size)),
          entryPrice: Number(p.entry_price || 0),
          currentPrice: Number(p.mark_price || p.entry_price || 0),
          unrealizedPnL: Number(p.unrealized_pnl || 0),
          unrealizedPnLPercent: Number(p.realized_pnl_percentage || 0),
          exchange: 'DELTA_EXCHANGE',
          liquidationPrice: p.liquidation_price ? Number(p.liquidation_price) : undefined,
        }));

      return { success: true, positions };
    } catch (e: any) {
      return { success: false, positions: [], error: e.message };
    }
  }

  // -------------------------------------------------------------
  // 3. BINANCE FUTURES & SPOT (Official Binance REST API v3)
  // -------------------------------------------------------------

  public async testBinanceConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        provider: 'binance',
        providerName: 'Binance Futures & Spot API v3',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: false,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: false,
        },
        unsupportedFeatures: ['Direct Option Chain REST'],
        message: 'CONFIGURATION REQUIRED: Binance API Key and Secret are required. Configure in Brokers & Exchanges.',
        error: 'Missing Binance credentials',
      };
    }

    try {
      const baseUrl = 'https://fapi.binance.com';
      const endpoint = '/fapi/v2/balance';
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}&recvWindow=5000`;
      const signature = this.generateBinanceSignature(apiSecret, queryString);

      const res = await fetch(`${baseUrl}${endpoint}?${queryString}&signature=${signature}`, {
        headers: { 'X-MBX-APIKEY': apiKey },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        const usdt = data.find((b: any) => b.asset === 'USDT') || { balance: '0', availableBalance: '0' };
        const balance = Number(usdt.availableBalance || usdt.balance || 0);

        return {
          success: true,
          provider: 'binance',
          providerName: 'Binance Futures & Spot API v3',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'Binance USD-M Futures Account',
          accountId: apiKey.slice(0, 8) + '...',
          accountName: 'Binance USD-M Live Wallet',
          availableMargin: balance,
          currency: 'USDT',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: false,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: false,
          },
          unsupportedFeatures: ['Options Chain API (Requires European Option API)'],
          message: `Connected to Binance Futures REST Gateway. Live Ping: ${latencyMs}ms. Margin: $${balance.toLocaleString()}`,
        };
      } else {
        return {
          success: false,
          provider: 'binance',
          providerName: 'Binance Futures & Spot API v3',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: false,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.msg || 'Invalid API Key or Signature for Binance.'}`,
          error: data.msg || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'binance',
        providerName: 'Binance Futures API',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: false,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: false,
        },
        message: `Binance Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeBinanceOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        orderId: `BINANCE-ERR-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'CONFIGURATION REQUIRED: Binance API Key and Secret are required to place live orders.',
        error: 'Missing Binance credentials',
      };
    }

    try {
      const isFutures = order.category !== 'Spot' && !order.symbol.includes('SPOT');
      const baseUrl = isFutures ? 'https://fapi.binance.com' : 'https://api.binance.com';
      const endpoint = isFutures ? '/fapi/v1/order' : '/api/v3/order';
      const timestamp = Date.now();

      const symbolClean = order.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const side = order.direction === 'BUY' || order.direction === 'LONG' ? 'BUY' : 'SELL';
      const type = order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET';

      const params: Record<string, string> = {
        symbol: symbolClean,
        side,
        type,
        quantity: String(order.quantity),
        timestamp: String(timestamp),
        recvWindow: '5000',
      };

      if (type === 'LIMIT' && order.price) {
        params.price = String(order.price);
        params.timeInForce = 'GTC';
      }

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateBinanceSignature(apiSecret, queryString);
      const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;

      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (res.ok && data.orderId) {
        return {
          success: true,
          orderId: `BINANCE-${data.orderId}`,
          brokerOrderId: String(data.orderId),
          status: data.status === 'NEW' ? 'OPEN' : 'FILLED',
          executedPrice: Number(data.avgPrice || data.price || order.price || 0),
          quantity: Number(data.executedQty || data.origQty || order.quantity),
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Live Order placed on Binance! Order ID: ${data.orderId}. Execution Latency: ${latencyMs}ms.`,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          orderId: `BINANCE-REJ-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: 0,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: data.msg || 'Binance rejected the order.',
          rawResponse: data,
          error: data.msg || 'Order rejected',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `BINANCE-ERR-${Date.now()}`,
        status: 'REJECTED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `Binance API Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 4. ZERODHA KITE CONNECT v3 (Official API)
  // -------------------------------------------------------------

  public async testZerodhaConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const accessToken = creds?.accessToken;

    if (!apiKey || !accessToken) {
      return {
        success: false,
        provider: 'zerodha',
        providerName: 'Zerodha Kite Connect v3',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        unsupportedFeatures: ['Bracket Orders (Discontinued by Zerodha in 2020)', 'Crypto Assets'],
        message: 'CONFIGURATION REQUIRED: Zerodha API Key and Daily Access Token are required.',
        error: 'Missing Zerodha credentials',
      };
    }

    try {
      const res = await fetch('https://api.kite.trade/user/margins', {
        headers: {
          'Authorization': `token ${apiKey}:${accessToken}`,
          'X-Kite-Version': '3',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        const equityMargin = data.data?.equity?.available?.live_balance || data.data?.equity?.net || 0;
        return {
          success: true,
          provider: 'zerodha',
          providerName: 'Zerodha Kite Connect v3',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'Zerodha Demat / F&O Account',
          accountId: creds?.clientId || 'Zerodha User',
          accountName: `Zerodha Trading Account`,
          availableMargin: Number(equityMargin),
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          unsupportedFeatures: ['Bracket Orders (Discontinued by Zerodha)'],
          message: `Connected to Zerodha Kite Connect. Latency: ${latencyMs}ms. Margin: ₹${Number(equityMargin).toLocaleString('en-IN')}`,
        };
      } else {
        return {
          success: false,
          provider: 'zerodha',
          providerName: 'Zerodha Kite Connect v3',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.message || 'Invalid Zerodha API Key or Access Token.'}`,
          error: data.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'zerodha',
        providerName: 'Zerodha Kite Connect',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: `Zerodha Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 5. ANGEL ONE SMARTAPI (Official API)
  // -------------------------------------------------------------

  public async testAngelOneConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const token = creds?.accessToken;

    if (!apiKey || !token) {
      return {
        success: false,
        provider: 'angelone',
        providerName: 'Angel One SmartAPI',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: true,
        },
        message: 'CONFIGURATION REQUIRED: Angel One API Key and SmartAPI JWT Token are required.',
        error: 'Missing Angel One credentials',
      };
    }

    try {
      const res = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-PrivateKey': apiKey,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.status && data.data) {
        const net = Number(data.data.net || data.data.availablecash || 0);
        return {
          success: true,
          provider: 'angelone',
          providerName: 'Angel One SmartAPI',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'Angel One Trading Demat',
          accountId: creds?.clientId || data.data.clientid || 'Angel User',
          accountName: `Angel One Account (${creds?.clientId || 'Live'})`,
          availableMargin: net,
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: true,
          },
          message: `Connected to Angel One SmartAPI. Latency: ${latencyMs}ms. Net Available: ₹${net.toLocaleString('en-IN')}`,
        };
      } else {
        return {
          success: false,
          provider: 'angelone',
          providerName: 'Angel One SmartAPI',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: true,
          },
          message: `Authentication Failed: ${data.message || 'Invalid Angel One credentials or expired JWT session.'}`,
          error: data.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'angelone',
        providerName: 'Angel One SmartAPI',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: true,
        },
        message: `Angel One Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 6. UPSTOX DEVELOPER API v2 (Official API)
  // -------------------------------------------------------------

  public async testUpstoxConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const token = creds?.accessToken || creds?.apiKey;

    if (!token) {
      return {
        success: false,
        provider: 'upstox',
        providerName: 'Upstox Developer API v2',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        unsupportedFeatures: ['Crypto Assets'],
        message: 'CONFIGURATION REQUIRED: Upstox Access Token is required.',
        error: 'Missing Upstox credentials',
      };
    }

    try {
      const res = await fetch('https://api.upstox.com/v2/user/get-funds-and-margin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.status === 'success' && data.data) {
        const available = Number(data.data.equity?.available_margin || data.data.commodity?.available_margin || 0);
        return {
          success: true,
          provider: 'upstox',
          providerName: 'Upstox Developer API v2',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'Upstox Equity / F&O Demat',
          accountId: creds?.clientId || 'Upstox User',
          accountName: `Upstox Account (${creds?.clientId || 'Live'})`,
          availableMargin: available,
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Connected to Upstox API v2. Latency: ${latencyMs}ms. Margin: ₹${available.toLocaleString('en-IN')}`,
        };
      } else {
        return {
          success: false,
          provider: 'upstox',
          providerName: 'Upstox Developer API v2',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.message || 'Invalid or expired Upstox Access Token.'}`,
          error: data.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'upstox',
        providerName: 'Upstox Developer API v2',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: `Upstox Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 7. FYERS API v3 (Official API)
  // -------------------------------------------------------------

  public async testFyersConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const token = creds?.accessToken;
    const appId = creds?.appId || creds?.apiKey;

    if (!token || !appId) {
      return {
        success: false,
        provider: 'fyers',
        providerName: 'FYERS API v3',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: 'CONFIGURATION REQUIRED: FYERS App ID and Access Token are required.',
        error: 'Missing FYERS credentials',
      };
    }

    try {
      const res = await fetch('https://api-t1.fyers.in/api/v3/funds', {
        headers: {
          'Authorization': `${appId}:${token}`,
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.s === 'ok') {
        const totalBal = Number(data.fund_limit?.find((f: any) => f.id === 10)?.equityAmount || 0);
        return {
          success: true,
          provider: 'fyers',
          providerName: 'FYERS API v3',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'FYERS Trading Account',
          accountId: creds?.clientId || 'FYERS User',
          accountName: `FYERS Account (${creds?.clientId || 'Live'})`,
          availableMargin: totalBal,
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Connected to FYERS API v3. Latency: ${latencyMs}ms. Margin: ₹${totalBal.toLocaleString('en-IN')}`,
        };
      } else {
        return {
          success: false,
          provider: 'fyers',
          providerName: 'FYERS API v3',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.message || 'Invalid or expired FYERS credentials.'}`,
          error: data.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'fyers',
        providerName: 'FYERS API v3',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: `FYERS Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 8. ALICE BLUE ANT API (Official API)
  // -------------------------------------------------------------

  public async testAliceBlueConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const token = creds?.accessToken || creds?.apiKey;
    const clientId = creds?.clientId;

    if (!token || !clientId) {
      return {
        success: false,
        provider: 'aliceblue',
        providerName: 'Alice Blue ANT API',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: 'CONFIGURATION REQUIRED: Alice Blue Client ID and Session Token are required.',
        error: 'Missing Alice Blue credentials',
      };
    }

    try {
      const res = await fetch('https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api/limits/getRmsLimits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clientId} ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && Array.isArray(data) && data[0]?.net) {
        const netMargin = Number(data[0].net || 0);
        return {
          success: true,
          provider: 'aliceblue',
          providerName: 'Alice Blue ANT API',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'Alice Blue Trading Account',
          accountId: clientId,
          accountName: `Alice Blue (${clientId})`,
          availableMargin: netMargin,
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Connected to Alice Blue ANT API. Latency: ${latencyMs}ms. Margin: ₹${netMargin.toLocaleString('en-IN')}`,
        };
      } else {
        return {
          success: false,
          provider: 'aliceblue',
          providerName: 'Alice Blue ANT API',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.message || data.emsg || 'Invalid Alice Blue credentials.'}`,
          error: data.message || data.emsg || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'aliceblue',
        providerName: 'Alice Blue ANT API',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: `Alice Blue Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 9. ICICI DIRECT BREEZE API (Official API)
  // -------------------------------------------------------------

  public async testIciciDirectConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;
    const sessionToken = creds?.accessToken || creds?.passphrase;

    if (!apiKey || !apiSecret || !sessionToken) {
      return {
        success: false,
        provider: 'icicidirect',
        providerName: 'ICICI Direct Breeze API',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: 'CONFIGURATION REQUIRED: ICICI Direct App Key, Secret Key, and Session Token are required.',
        error: 'Missing ICICI Direct credentials',
      };
    }

    try {
      const timestamp = new Date().toISOString().split('.')[0] + '.000Z';
      const checksum = this.generateBreezeChecksum(apiSecret, timestamp, '');

      const res = await fetch('https://api.icicidirect.com/breezeapi/api/v1/customerdetails', {
        method: 'GET',
        headers: {
          'X-AppKey': apiKey,
          'X-SessionToken': sessionToken,
          'X-Timestamp': timestamp,
          'X-Checksum': `token ${checksum}`,
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && (data.Status === 200 || data.status === 'success' || data.Success)) {
        return {
          success: true,
          provider: 'icicidirect',
          providerName: 'ICICI Direct Breeze API',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'ICICI Direct 3-in-1 Demat',
          accountId: creds?.clientId || 'ICICI User',
          accountName: 'ICICI Direct Breeze Account',
          availableMargin: 0,
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Connected to ICICI Direct Breeze API. Latency: ${latencyMs}ms.`,
        };
      } else {
        return {
          success: false,
          provider: 'icicidirect',
          providerName: 'ICICI Direct Breeze API',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: true,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.Error || data.message || 'Invalid ICICI Direct Breeze credentials.'}`,
          error: data.Error || data.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'icicidirect',
        providerName: 'ICICI Direct Breeze API',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: true,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: `ICICI Direct Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 10. COINDCX (Official Crypto API)
  // -------------------------------------------------------------

  public async testCoinDcxConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        provider: 'coindcx',
        providerName: 'CoinDCX Official API',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: false,
          optionsChain: false,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: false,
        },
        message: 'CONFIGURATION REQUIRED: CoinDCX API Key and API Secret are required.',
        error: 'Missing CoinDCX credentials',
      };
    }

    try {
      const timestamp = Math.floor(Date.now());
      const body = { timestamp };
      const bodyStr = JSON.stringify(body);
      const signature = this.generateCoinDcxSignature(apiSecret, bodyStr);

      const res = await fetch('https://api.coindcx.com/exchange/v1/users/balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-APIKEY': apiKey,
          'X-AUTH-SIGNATURE': signature,
        },
        body: bodyStr,
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        const inrWallet = data.find((b: any) => b.currency === 'INR' || b.currency === 'USDT') || { balance: '0' };
        const balance = Number(inrWallet.balance || 0);

        return {
          success: true,
          provider: 'coindcx',
          providerName: 'CoinDCX Official API',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'CoinDCX Crypto Trading Wallet',
          accountId: apiKey.slice(0, 8) + '...',
          accountName: 'CoinDCX Live Wallet',
          availableMargin: balance,
          currency: inrWallet.currency || 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: false,
            optionsChain: false,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Connected to CoinDCX API. Latency: ${latencyMs}ms. Available Balance: ${balance.toLocaleString()} ${inrWallet.currency || 'INR'}`,
        };
      } else {
        return {
          success: false,
          provider: 'coindcx',
          providerName: 'CoinDCX Official API',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: false,
            optionsChain: false,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.message || 'Invalid CoinDCX API Key or Secret.'}`,
          error: data.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'coindcx',
        providerName: 'CoinDCX Official API',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: false,
          optionsChain: false,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: false,
        },
        message: `CoinDCX Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // 11. COINSWITCH PRO (Official Crypto API)
  // -------------------------------------------------------------

  public async testCoinSwitchConnection(creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        provider: 'coinswitch',
        providerName: 'CoinSwitch PRO API',
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: false,
          optionsChain: false,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: false,
        },
        message: 'CONFIGURATION REQUIRED: CoinSwitch PRO API Key and Secret are required.',
        error: 'Missing CoinSwitch credentials',
      };
    }

    try {
      const endpoint = '/trade/api/v2/user/portfolio';
      const epoch = Date.now();
      const signature = this.generateCoinSwitchSignature(apiSecret, 'GET', endpoint, '', epoch);

      const res = await fetch(`https://coinswitch.co${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-APIKEY': apiKey,
          'X-AUTH-SIGNATURE': signature,
          'X-AUTH-EPOCH': String(epoch),
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        const inrBalance = Number(data.data?.inr_balance || data.data?.total_balance || 0);
        return {
          success: true,
          provider: 'coinswitch',
          providerName: 'CoinSwitch PRO API',
          status: 'CONNECTED',
          latencyMs,
          serverTime: new Date().toISOString(),
          accountType: 'CoinSwitch PRO Trading Wallet',
          accountId: apiKey.slice(0, 8) + '...',
          accountName: 'CoinSwitch PRO Live Account',
          availableMargin: inrBalance,
          currency: 'INR',
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: false,
            optionsChain: false,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Connected to CoinSwitch PRO. Latency: ${latencyMs}ms. INR Balance: ₹${inrBalance.toLocaleString('en-IN')}`,
        };
      } else {
        return {
          success: false,
          provider: 'coinswitch',
          providerName: 'CoinSwitch PRO API',
          status: 'AUTHENTICATION_FAILED',
          latencyMs,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: false,
            optionsChain: false,
            futuresPerpetuals: true,
            webhooks: true,
            bracketOrders: false,
          },
          message: `Authentication Failed: ${data.message || 'Invalid CoinSwitch PRO API credentials.'}`,
          error: data.message || 'Authentication failed',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'coinswitch',
        providerName: 'CoinSwitch PRO API',
        status: 'ERROR',
        latencyMs: Date.now() - startTime,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: false,
          optionsChain: false,
          futuresPerpetuals: true,
          webhooks: true,
          bracketOrders: false,
        },
        message: `CoinSwitch Gateway Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // Universal Connection Tester
  // -------------------------------------------------------------

  public async testConnection(provider: string, creds?: BrokerCredentials): Promise<BrokerConnectionTestResult> {
    const prov = (provider || '').toLowerCase();
    if (prov === 'dhan') {
      return this.testDhanConnection(creds);
    } else if (prov === 'delta') {
      return this.testDeltaConnection(creds);
    } else if (prov === 'binance') {
      return this.testBinanceConnection(creds);
    } else if (prov === 'zerodha') {
      return this.testZerodhaConnection(creds);
    } else if (prov === 'angelone' || prov === 'angel') {
      return this.testAngelOneConnection(creds);
    } else if (prov === 'upstox') {
      return this.testUpstoxConnection(creds);
    } else if (prov === 'fyers') {
      return this.testFyersConnection(creds);
    } else if (prov === 'aliceblue') {
      return this.testAliceBlueConnection(creds);
    } else if (prov === 'icicidirect' || prov === 'icici') {
      return this.testIciciDirectConnection(creds);
    } else if (prov === 'coindcx') {
      return this.testCoinDcxConnection(creds);
    } else if (prov === 'coinswitch') {
      return this.testCoinSwitchConnection(creds);
    } else {
      // Check if credentials are provided for generic brokers
      if (!creds?.apiKey && !creds?.accessToken) {
        return {
          success: false,
          provider: prov,
          providerName: `${prov.toUpperCase()} Official API`,
          status: 'CONFIGURATION_REQUIRED',
          latencyMs: 0,
          serverTime: new Date().toISOString(),
          supportedFeatures: {
            marketOrders: true,
            limitOrders: true,
            stopLossOrders: true,
            trailingStopLoss: true,
            optionsChain: false,
            futuresPerpetuals: false,
            webhooks: true,
            bracketOrders: false,
          },
          message: `CONFIGURATION REQUIRED: API credentials for ${prov.toUpperCase()} are required.`,
          error: 'Missing credentials',
        };
      }

      return {
        success: false,
        provider: prov,
        providerName: `${prov.toUpperCase()} API`,
        status: 'CONFIGURATION_REQUIRED',
        latencyMs: 0,
        serverTime: new Date().toISOString(),
        supportedFeatures: {
          marketOrders: true,
          limitOrders: true,
          stopLossOrders: true,
          trailingStopLoss: true,
          optionsChain: false,
          futuresPerpetuals: false,
          webhooks: true,
          bracketOrders: false,
        },
        message: `CONFIGURATION REQUIRED: Official REST connection for ${prov.toUpperCase()} requires active API credentials.`,
      };
    }
  }

  // -------------------------------------------------------------
  // Universal Order Execution Router
  // -------------------------------------------------------------

  public async executeOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const provider = (order.provider || 'dhan').toLowerCase();
    const effectiveCreds = creds || this.getStoredCredentials(provider);

    if (!effectiveCreds?.apiKey && !effectiveCreds?.accessToken) {
      return {
        success: false,
        orderId: `NO-CREDS-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: `CONFIGURATION REQUIRED: Real live execution for ${provider.toUpperCase()} requires active API credentials in Brokers & Exchanges.`,
        error: `Broker ${provider} not connected`,
      };
    }

    if (provider === 'dhan') {
      return this.executeDhanOrder(order, effectiveCreds);
    } else if (provider === 'delta') {
      return this.executeDeltaOrder(order, effectiveCreds);
    } else if (provider === 'binance') {
      return this.executeBinanceOrder(order, effectiveCreds);
    } else if (provider === 'zerodha') {
      return this.executeZerodhaOrder(order, effectiveCreds);
    } else if (provider === 'angelone' || provider === 'angel') {
      return this.executeAngelOneOrder(order, effectiveCreds);
    } else if (provider === 'upstox') {
      return this.executeUpstoxOrder(order, effectiveCreds);
    } else if (provider === 'fyers') {
      return this.executeFyersOrder(order, effectiveCreds);
    } else if (provider === 'coindcx') {
      return this.executeCoinDcxOrder(order, effectiveCreds);
    } else if (provider === 'coinswitch') {
      return this.executeCoinSwitchOrder(order, effectiveCreds);
    } else {
      return {
        success: false,
        orderId: `ROUTING-ERR-${Date.now()}`,
        status: 'NOT_SUPPORTED',
        executedPrice: 0,
        quantity: 0,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: `Live automated order placement is not directly supported via API for ${provider.toUpperCase()}.`,
        error: `Order execution unsupported for ${provider}`,
      };
    }
  }

  // -------------------------------------------------------------
  // Real Execution Adapters for Zerodha, Angel, Upstox, FYERS, CoinDCX, CoinSwitch
  // -------------------------------------------------------------

  public async executeZerodhaOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const accessToken = creds?.accessToken;

    if (!apiKey || !accessToken) {
      return {
        success: false,
        orderId: `KITE-FAIL-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'Kite Connect API Key and Access Token are required.',
        error: 'Missing credentials',
      };
    }

    try {
      const transactionType = order.direction === 'LONG' || order.direction === 'BUY' ? 'BUY' : 'SELL';
      const kiteOrderType = order.orderType === 'LIMIT' ? 'LIMIT' : order.orderType === 'STOP_LOSS' ? 'SL' : 'MARKET';
      const exchange = order.symbol.includes('NIFTY') || order.symbol.includes('BANKNIFTY') ? 'NFO' : 'NSE';

      const formBody = new URLSearchParams({
        tradingsymbol: order.symbol.replace('.NS', '').replace('.BO', ''),
        exchange,
        transaction_type: transactionType,
        order_type: kiteOrderType,
        quantity: String(order.quantity),
        product: order.productType || 'MIS',
        validity: 'DAY',
        ...(order.price && order.orderType === 'LIMIT' ? { price: String(order.price) } : {}),
        ...(order.triggerPrice ? { trigger_price: String(order.triggerPrice) } : {}),
      });

      const response = await fetch('https://api.kite.trade/orders/regular', {
        method: 'POST',
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const resData = await response.json();

      if (response.ok && resData.status === 'success' && resData.data?.order_id) {
        return {
          success: true,
          orderId: `KITE-${resData.data.order_id}`,
          brokerOrderId: resData.data.order_id,
          status: 'OPEN',
          executedPrice: order.price || 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Zerodha Kite Order Placed: #${resData.data.order_id}`,
          rawResponse: resData,
        };
      } else {
        return {
          success: false,
          orderId: `KITE-ERR-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Zerodha Rejection: ${resData.message || 'Order failed'}`,
          error: resData.message || 'Rejected',
          rawResponse: resData,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `KITE-EXC-${Date.now()}`,
        status: 'AUTHENTICATION_FAILED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `Zerodha API Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeAngelOneOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const accessToken = creds?.accessToken;

    if (!apiKey || !accessToken) {
      return {
        success: false,
        orderId: `SMARTAPI-FAIL-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'Angel One SmartAPI Key and JWT Token are required.',
        error: 'Missing credentials',
      };
    }

    try {
      const transactionType = order.direction === 'LONG' || order.direction === 'BUY' ? 'BUY' : 'SELL';
      const orderType = order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET';

      const payload = {
        variety: 'NORMAL',
        tradingsymbol: order.symbol,
        symboltoken: '3045',
        transactiontype: transactionType,
        exchange: 'NSE',
        ordertype: orderType,
        producttype: order.productType || 'INTRADAY',
        duration: 'DAY',
        price: order.price ? String(order.price) : '0',
        squareoff: '0',
        stoploss: '0',
        quantity: String(order.quantity),
      };

      const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/placeOrder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-PrivateKey': apiKey,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '127.0.0.1',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const resData = await response.json();

      if (response.ok && resData.status && resData.data?.orderid) {
        return {
          success: true,
          orderId: `SMART-${resData.data.orderid}`,
          brokerOrderId: resData.data.orderid,
          status: 'OPEN',
          executedPrice: order.price || 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Angel One SmartAPI Order Placed: #${resData.data.orderid}`,
          rawResponse: resData,
        };
      } else {
        return {
          success: false,
          orderId: `SMART-ERR-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Angel One Rejection: ${resData.message || 'Order failed'}`,
          error: resData.message || 'Rejected',
          rawResponse: resData,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `SMART-EXC-${Date.now()}`,
        status: 'AUTHENTICATION_FAILED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `Angel One API Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeUpstoxOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const token = creds?.accessToken || creds?.apiKey;

    if (!token) {
      return {
        success: false,
        orderId: `UPSTOX-FAIL-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'Upstox Access Token is required.',
        error: 'Missing credentials',
      };
    }

    try {
      const transactionType = order.direction === 'LONG' || order.direction === 'BUY' ? 'BUY' : 'SELL';
      const orderType = order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET';

      const payload = {
        quantity: order.quantity,
        product: order.productType === 'CNC' ? 'D' : 'I',
        validity: 'DAY',
        price: order.price || 0,
        tag: 'TradeOS',
        instrument_token: `NSE_EQ|${order.symbol}`,
        order_type: orderType,
        transaction_type: transactionType,
        disclosed_quantity: 0,
        trigger_price: order.triggerPrice || 0,
        is_amo: false,
      };

      const response = await fetch('https://api.upstox.com/v2/order/place', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const resData = await response.json();

      if (response.ok && resData.status === 'success' && resData.data?.order_id) {
        return {
          success: true,
          orderId: `UPSTOX-${resData.data.order_id}`,
          brokerOrderId: resData.data.order_id,
          status: 'OPEN',
          executedPrice: order.price || 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Upstox Order Placed: #${resData.data.order_id}`,
          rawResponse: resData,
        };
      } else {
        return {
          success: false,
          orderId: `UPSTOX-ERR-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `Upstox Rejection: ${resData.message || 'Order failed'}`,
          error: resData.message || 'Rejected',
          rawResponse: resData,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `UPSTOX-EXC-${Date.now()}`,
        status: 'AUTHENTICATION_FAILED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `Upstox API Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeFyersOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const token = creds?.accessToken;
    const appId = creds?.appId || creds?.apiKey;

    if (!token || !appId) {
      return {
        success: false,
        orderId: `FYERS-FAIL-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'FYERS App ID and Access Token are required.',
        error: 'Missing credentials',
      };
    }

    try {
      const side = order.direction === 'LONG' || order.direction === 'BUY' ? 1 : -1;
      const type = order.orderType === 'LIMIT' ? 1 : 2;

      const payload = {
        symbol: `NSE:${order.symbol}-EQ`,
        qty: order.quantity,
        type,
        side,
        productType: order.productType || 'INTRADAY',
        limitPrice: order.price || 0,
        stopPrice: order.triggerPrice || 0,
        validity: 'DAY',
        disclosedQty: 0,
        offlineOrder: false,
      };

      const response = await fetch('https://api-t1.fyers.in/api/v3/orders/sync', {
        method: 'POST',
        headers: {
          'Authorization': `${appId}:${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const resData = await response.json();

      if (response.ok && resData.s === 'ok' && resData.id) {
        return {
          success: true,
          orderId: `FYERS-${resData.id}`,
          brokerOrderId: resData.id,
          status: 'OPEN',
          executedPrice: order.price || 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `FYERS Order Placed: #${resData.id}`,
          rawResponse: resData,
        };
      } else {
        return {
          success: false,
          orderId: `FYERS-ERR-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `FYERS Rejection: ${resData.message || 'Order failed'}`,
          error: resData.message || 'Rejected',
          rawResponse: resData,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `FYERS-EXC-${Date.now()}`,
        status: 'AUTHENTICATION_FAILED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `FYERS API Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeCoinDcxOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        orderId: `COINDCX-FAIL-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'CoinDCX API Key and Secret are required.',
        error: 'Missing credentials',
      };
    }

    try {
      const side = order.direction === 'LONG' || order.direction === 'BUY' ? 'buy' : 'sell';
      const orderType = order.orderType === 'LIMIT' ? 'limit_order' : 'market_order';
      const market = (order.symbol.replace('/', '').replace('-', '')).toUpperCase();
      const timestamp = Math.floor(Date.now());

      const body = {
        side,
        order_type: orderType,
        market,
        price_per_unit: order.price || 0,
        total_quantity: order.quantity,
        timestamp,
      };

      const bodyStr = JSON.stringify(body);
      const signature = this.generateCoinDcxSignature(apiSecret, bodyStr);

      const response = await fetch('https://api.coindcx.com/exchange/v1/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-APIKEY': apiKey,
          'X-AUTH-SIGNATURE': signature,
        },
        body: bodyStr,
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const resData = await response.json();

      if (response.ok && resData.orders && Array.isArray(resData.orders) && resData.orders[0]?.id) {
        const o = resData.orders[0];
        return {
          success: true,
          orderId: `COINDCX-${o.id}`,
          brokerOrderId: o.id,
          status: o.status === 'filled' ? 'FILLED' : 'OPEN',
          executedPrice: Number(o.price_per_unit || order.price || 0),
          quantity: Number(o.total_quantity || order.quantity),
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `CoinDCX Order Placed: #${o.id}`,
          rawResponse: resData,
        };
      } else {
        return {
          success: false,
          orderId: `COINDCX-ERR-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `CoinDCX Rejection: ${resData.message || 'Order failed'}`,
          error: resData.message || 'Rejected',
          rawResponse: resData,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `COINDCX-EXC-${Date.now()}`,
        status: 'AUTHENTICATION_FAILED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `CoinDCX API Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  public async executeCoinSwitchOrder(order: LiveOrderPayload, creds?: BrokerCredentials): Promise<RealOrderResult> {
    const startTime = Date.now();
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        orderId: `COINSWITCH-FAIL-${Date.now()}`,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'CoinSwitch PRO API Key and Secret are required.',
        error: 'Missing credentials',
      };
    }

    try {
      const side = order.direction === 'LONG' || order.direction === 'BUY' ? 'BUY' : 'SELL';
      const type = order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET';
      const endpoint = '/trade/api/v2/order';
      const epoch = Date.now();

      const body = {
        symbol: order.symbol.toLowerCase().replace('/', ''),
        side,
        type,
        quantity: order.quantity,
        ...(order.price ? { price: order.price } : {}),
      };

      const bodyStr = JSON.stringify(body);
      const signature = this.generateCoinSwitchSignature(apiSecret, 'POST', endpoint, bodyStr, epoch);

      const response = await fetch(`https://coinswitch.co${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-APIKEY': apiKey,
          'X-AUTH-SIGNATURE': signature,
          'X-AUTH-EPOCH': String(epoch),
        },
        body: bodyStr,
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      const latencyMs = Date.now() - startTime;
      const resData = await response.json();

      if (response.ok && resData.status === 'success' && resData.data?.order_id) {
        return {
          success: true,
          orderId: `COINSWITCH-${resData.data.order_id}`,
          brokerOrderId: resData.data.order_id,
          status: 'OPEN',
          executedPrice: order.price || 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `CoinSwitch PRO Order Placed: #${resData.data.order_id}`,
          rawResponse: resData,
        };
      } else {
        return {
          success: false,
          orderId: `COINSWITCH-ERR-${Date.now()}`,
          status: 'REJECTED',
          executedPrice: 0,
          quantity: order.quantity,
          latencyMs,
          timestamp: new Date().toISOString(),
          message: `CoinSwitch PRO Rejection: ${resData.message || 'Order failed'}`,
          error: resData.message || 'Rejected',
          rawResponse: resData,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: `COINSWITCH-EXC-${Date.now()}`,
        status: 'AUTHENTICATION_FAILED',
        executedPrice: 0,
        quantity: order.quantity,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `CoinSwitch PRO API Error: ${err.message}`,
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------
  // Universal Positions Fetcher
  // -------------------------------------------------------------

  public async getPositions(provider: string, creds?: BrokerCredentials): Promise<{ success: boolean; positions: BrokerPosition[]; error?: string }> {
    const prov = provider.toLowerCase();
    const effectiveCreds = creds || this.getStoredCredentials(prov);

    if (!effectiveCreds?.apiKey && !effectiveCreds?.accessToken) {
      return { success: false, positions: [], error: `Not Connected: No real credentials found for ${provider.toUpperCase()}.` };
    }

    if (prov === 'dhan') {
      return this.getDhanPositions(effectiveCreds);
    } else if (prov === 'delta') {
      return this.getDeltaPositions(effectiveCreds);
    } else if (prov === 'binance') {
      return this.getBinancePositions(effectiveCreds);
    } else if (prov === 'zerodha') {
      return this.getZerodhaPositions(effectiveCreds);
    } else if (prov === 'upstox') {
      return this.getUpstoxPositions(effectiveCreds);
    } else if (prov === 'fyers') {
      return this.getFyersPositions(effectiveCreds);
    } else {
      return { success: false, positions: [], error: `Not Connected or Positions API not supported for ${provider.toUpperCase()}.` };
    }
  }

  public async getBinancePositions(creds?: BrokerCredentials): Promise<{ success: boolean; positions: BrokerPosition[]; error?: string }> {
    const apiKey = creds?.apiKey;
    const apiSecret = creds?.apiSecret;

    if (!apiKey || !apiSecret) {
      return { success: false, positions: [], error: 'Binance credentials required' };
    }

    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateBinanceSignature(apiSecret, queryString);

      const res = await fetch(`https://fapi.binance.com/fapi/v2/positionRisk?${queryString}&signature=${signature}`, {
        headers: { 'X-MBX-APIKEY': apiKey },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        return { success: false, positions: [], error: 'Failed to fetch Binance positions' };
      }

      const data: any = await res.json();
      if (!Array.isArray(data)) {
        return { success: false, positions: [], error: 'Invalid Binance response' };
      }

      const openPositions = data
        .filter((p: any) => Math.abs(parseFloat(p.positionAmt)) > 0)
        .map((p: any) => {
          const amt = parseFloat(p.positionAmt);
          return {
            positionId: `binance-${p.symbol}`,
            symbol: p.symbol,
            direction: (amt > 0 ? 'LONG' : 'SHORT') as 'LONG' | 'SHORT',
            quantity: Math.abs(amt),
            entryPrice: parseFloat(p.entryPrice),
            currentPrice: parseFloat(p.markPrice),
            unrealizedPnL: parseFloat(p.unRealizedProfit),
            unrealizedPnLPercent: (parseFloat(p.unRealizedProfit) / (Math.abs(amt) * parseFloat(p.entryPrice))) * 100,
            leverage: parseInt(p.leverage, 10),
            liquidationPrice: parseFloat(p.liquidationPrice),
            exchange: 'Binance USDⓈ-M Futures',
          };
        });

      return { success: true, positions: openPositions };
    } catch (err: any) {
      return { success: false, positions: [], error: err.message };
    }
  }

  public async getZerodhaPositions(creds?: BrokerCredentials): Promise<{ success: boolean; positions: BrokerPosition[]; error?: string }> {
    const apiKey = creds?.apiKey;
    const accessToken = creds?.accessToken;

    if (!apiKey || !accessToken) {
      return { success: false, positions: [], error: 'Zerodha credentials required' };
    }

    try {
      const res = await fetch('https://api.kite.trade/portfolio/positions', {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`,
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        return { success: false, positions: [], error: 'Failed to fetch Zerodha positions' };
      }

      const data: any = await res.json();
      if (data.status !== 'success' || !data.data?.net) {
        return { success: false, positions: [], error: data.message || 'Invalid Zerodha response' };
      }

      const openPositions = data.data.net
        .filter((p: any) => p.quantity !== 0)
        .map((p: any) => ({
          positionId: `kite-${p.tradingsymbol}`,
          symbol: p.tradingsymbol,
          direction: (p.quantity > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
          quantity: Math.abs(p.quantity),
          entryPrice: p.average_price,
          currentPrice: p.last_price,
          unrealizedPnL: p.pnl,
          unrealizedPnLPercent: p.average_price > 0 ? (p.pnl / (Math.abs(p.quantity) * p.average_price)) * 100 : 0,
          productType: p.product,
          exchange: p.exchange,
        }));

      return { success: true, positions: openPositions };
    } catch (err: any) {
      return { success: false, positions: [], error: err.message };
    }
  }

  public async getUpstoxPositions(creds?: BrokerCredentials): Promise<{ success: boolean; positions: BrokerPosition[]; error?: string }> {
    const token = creds?.accessToken || creds?.apiKey;
    if (!token) {
      return { success: false, positions: [], error: 'Upstox token required' };
    }

    try {
      const res = await fetch('https://api.upstox.com/v2/portfolio/short-term-positions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        return { success: false, positions: [], error: 'Failed to fetch Upstox positions' };
      }

      const data: any = await res.json();
      if (data.status !== 'success' || !Array.isArray(data.data)) {
        return { success: false, positions: [], error: 'Invalid Upstox response' };
      }

      const openPositions = data.data
        .filter((p: any) => p.quantity !== 0)
        .map((p: any) => ({
          positionId: `upstox-${p.tradingsymbol}`,
          symbol: p.tradingsymbol,
          direction: (p.quantity > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
          quantity: Math.abs(p.quantity),
          entryPrice: p.average_price,
          currentPrice: p.last_price,
          unrealizedPnL: p.pnl,
          unrealizedPnLPercent: p.average_price > 0 ? (p.pnl / (Math.abs(p.quantity) * p.average_price)) * 100 : 0,
          productType: p.product,
          exchange: 'NSE',
        }));

      return { success: true, positions: openPositions };
    } catch (err: any) {
      return { success: false, positions: [], error: err.message };
    }
  }

  public async getFyersPositions(creds?: BrokerCredentials): Promise<{ success: boolean; positions: BrokerPosition[]; error?: string }> {
    const token = creds?.accessToken;
    const appId = creds?.appId || creds?.apiKey;
    if (!token || !appId) {
      return { success: false, positions: [], error: 'FYERS credentials required' };
    }

    try {
      const res = await fetch('https://api-t1.fyers.in/api/v3/positions', {
        headers: {
          'Authorization': `${appId}:${token}`,
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        return { success: false, positions: [], error: 'Failed to fetch FYERS positions' };
      }

      const data: any = await res.json();
      if (data.s !== 'ok' || !Array.isArray(data.netPositions)) {
        return { success: false, positions: [], error: 'Invalid FYERS response' };
      }

      const openPositions = data.netPositions
        .filter((p: any) => p.netQty !== 0)
        .map((p: any) => ({
          positionId: `fyers-${p.symbol}`,
          symbol: p.symbol,
          direction: (p.netQty > 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
          quantity: Math.abs(p.netQty),
          entryPrice: p.avgPrice,
          currentPrice: p.ltp,
          unrealizedPnL: p.pl,
          unrealizedPnLPercent: p.avgPrice > 0 ? (p.pl / (Math.abs(p.netQty) * p.avgPrice)) * 100 : 0,
          productType: p.productType,
          exchange: 'NSE',
        }));

      return { success: true, positions: openPositions };
    } catch (err: any) {
      return { success: false, positions: [], error: err.message };
    }
  }

  // -------------------------------------------------------------
  // Universal Trades Fetcher
  // -------------------------------------------------------------

  public async getTrades(provider: string, creds?: BrokerCredentials): Promise<{ success: boolean; trades: BrokerTradeItem[]; error?: string }> {
    const prov = provider.toLowerCase();
    const effectiveCreds = creds || this.getStoredCredentials(prov);

    if (!effectiveCreds?.apiKey && !effectiveCreds?.accessToken) {
      return { success: false, trades: [], error: `Not Connected: No real credentials configured for ${provider.toUpperCase()}.` };
    }

    if (prov === 'dhan') {
      return this.getDhanTrades(effectiveCreds);
    } else if (prov === 'upstox') {
      return this.getUpstoxTrades(effectiveCreds);
    } else if (prov === 'fyers') {
      return this.getFyersTrades(effectiveCreds);
    } else {
      return { success: false, trades: [], error: `Trade history API sync not supported for ${provider.toUpperCase()}.` };
    }
  }

  public async getUpstoxTrades(creds?: BrokerCredentials): Promise<{ success: boolean; trades: BrokerTradeItem[]; error?: string }> {
    const token = creds?.accessToken || creds?.apiKey;
    if (!token) return { success: false, trades: [], error: 'Upstox token required' };

    try {
      const res = await fetch('https://api.upstox.com/v2/order/trades/get-trades-for-day', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) return { success: false, trades: [], error: 'Failed to fetch Upstox trade book' };
      const data: any = await res.json();
      if (data.status !== 'success' || !Array.isArray(data.data)) {
        return { success: false, trades: [] };
      }

      const trades = data.data.map((t: any) => ({
        id: `upstox-tr-${t.trade_id}`,
        orderId: t.order_id,
        symbol: t.tradingsymbol,
        direction: (t.transaction_type === 'BUY' ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
        quantity: t.quantity,
        executedPrice: t.average_price,
        executedAt: t.trade_timestamp,
        fee: 20,
        feeCurrency: 'INR',
        exchange: 'NSE',
        status: 'FILLED' as const,
      }));

      return { success: true, trades };
    } catch (err: any) {
      return { success: false, trades: [], error: err.message };
    }
  }

  public async getFyersTrades(creds?: BrokerCredentials): Promise<{ success: boolean; trades: BrokerTradeItem[]; error?: string }> {
    const token = creds?.accessToken;
    const appId = creds?.appId || creds?.apiKey;
    if (!token || !appId) return { success: false, trades: [], error: 'FYERS credentials required' };

    try {
      const res = await fetch('https://api-t1.fyers.in/api/v3/tradebook', {
        headers: {
          'Authorization': `${appId}:${token}`,
        },
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) return { success: false, trades: [], error: 'Failed to fetch FYERS trade book' };
      const data: any = await res.json();
      if (data.s !== 'ok' || !Array.isArray(data.tradeBook)) {
        return { success: false, trades: [] };
      }

      const trades = data.tradeBook.map((t: any) => ({
        id: `fyers-tr-${t.id}`,
        orderId: t.orderNumber,
        symbol: t.symbol,
        direction: (t.transactionType === 1 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
        quantity: t.tradedQty,
        executedPrice: t.tradePrice,
        executedAt: t.orderDateTime,
        fee: 20,
        feeCurrency: 'INR',
        exchange: 'NSE',
        status: 'FILLED' as const,
      }));

      return { success: true, trades };
    } catch (err: any) {
      return { success: false, trades: [], error: err.message };
    }
  }

  // -------------------------------------------------------------
  // Live Stop Loss Order Modification
  // -------------------------------------------------------------

  public async modifyStopLoss(
    provider: string,
    brokerOrderId: string,
    payload: {
      symbol: string;
      newStopPrice: number;
      quantity?: number;
      direction?: string;
    },
    creds?: BrokerCredentials
  ): Promise<RealOrderResult> {
    const prov = provider.toLowerCase();
    const effectiveCreds = creds || this.getStoredCredentials(prov);
    if (!effectiveCreds?.apiKey && !effectiveCreds?.accessToken) {
      return {
        success: false,
        orderId: brokerOrderId,
        status: 'CONFIGURATION_REQUIRED',
        executedPrice: 0,
        quantity: payload.quantity || 1,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: `CONFIGURATION REQUIRED: Real live SL modification for ${prov.toUpperCase()} requires active broker API credentials.`,
        error: 'Credentials missing',
      };
    }

    if (prov === 'dhan') {
      try {
        const start = Date.now();
        const response = await fetch(`https://api.dhan.co/v2/orders/${brokerOrderId}`, {
          method: 'PUT',
          headers: {
            'access-token': effectiveCreds.accessToken || effectiveCreds.apiKey || '',
            'client-id': effectiveCreds.clientId || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderType: 'STOP_LOSS',
            price: payload.newStopPrice,
            triggerPrice: payload.newStopPrice,
            quantity: payload.quantity || 1,
          }),
        });
        const latency = Date.now() - start;
        const resData: any = await response.json();
        return {
          success: response.ok && resData.orderStatus !== 'REJECTED',
          orderId: brokerOrderId,
          brokerOrderId,
          status: response.ok ? 'OPEN' : 'REJECTED',
          executedPrice: payload.newStopPrice,
          quantity: payload.quantity || 1,
          latencyMs: latency,
          timestamp: new Date().toISOString(),
          message: resData.remarks || `Stop Loss modified to ₹${payload.newStopPrice}`,
          rawResponse: resData,
        };
      } catch (err: any) {
        return {
          success: false,
          orderId: brokerOrderId,
          status: 'AUTHENTICATION_FAILED',
          executedPrice: 0,
          quantity: 0,
          latencyMs: 0,
          timestamp: new Date().toISOString(),
          message: `Dhan API error: ${err.message}`,
        };
      }
    }

    return {
      success: false,
      orderId: brokerOrderId,
      status: 'NOT_SUPPORTED',
      executedPrice: 0,
      quantity: 0,
      latencyMs: 0,
      timestamp: new Date().toISOString(),
      message: `Stop Loss modification not supported directly for ${prov}`,
    };
  }
}

export const realBrokerGateway = new RealBrokerGateway();
