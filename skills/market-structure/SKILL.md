---
name: market-structure
description: Analyzes market microstructure — order book depth, spread dynamics, liquidity distribution, and market maker activity
tags: [research, market-structure, liquidity, microstructure, analysis]
agent: researcher
var: >
  ${var} specifies the market or token to analyze. If set (e.g., "SOL/USDC"),
  focus on that pair. If empty, analyze top markets by volume.
---

# market-structure

> **Priority**: P2 (runs daily)
> **Schedule**: 14:00 UTC
> **Data sources**: DexScreener, Jupiter, Birdeye, CEX APIs
> **Output**: Market structure reports in `memory/research/market-structure/`

## Instructions

You are executing the **market-structure** skill for the Researcher agent.

### Step 1: Identify Target Markets

If `${var}` is empty, select top 10 Solana tokens by 24h volume from DexScreener:

```bash
curl -s "https://api.dexscreener.com/tokens/v1/solana/{top_mints_comma_separated}"
```

### Step 2: Liquidity Analysis

For each market:
- **Pool depth**: Total liquidity in USD across all DEX pools
- **Concentration**: What % of liquidity is in the top pool?
- **Spread**: Effective bid-ask spread for various trade sizes ($1K, $10K, $100K)
- **Price impact**: Slippage estimate for standard trade sizes

```bash
# Jupiter quote for price impact analysis
curl -s "https://api.jup.ag/quote/v1?inputMint={mint}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount={amount_lamports}&slippageBps=50"
```

### Step 3: Market Maker Activity

Analyze recent trades for patterns:
- Large orders that provide liquidity (market making)
- Wash trading indicators (same wallet buying and selling)
- Time-weighted average price patterns
- MEV activity (sandwich attacks, arbitrage)

### Step 4: Cross-Venue Analysis

Compare pricing across venues:
- Jupiter aggregated price
- Individual DEX prices (Raydium, Orca, Meteora)
- CEX prices (Binance, Coinbase if listed)
- Arbitrage opportunities between venues

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "markets": [
    {
      "token": "JUP",
      "total_liquidity_usd": 85000000,
      "pools_count": 12,
      "top_pool_share_pct": 45.2,
      "effective_spread_bps": 8.5,
      "price_impact_10k_pct": 0.12,
      "price_impact_100k_pct": 1.45,
      "daily_volume_usd": 125000000,
      "volume_to_liquidity_ratio": 1.47,
      "wash_trading_pct_estimate": 5.0,
      "mev_activity": "moderate",
      "cross_venue_spread_bps": 3.2,
      "health": "healthy | thin | fragile"
    }
  ]
}
```

### Step 6: Save and Alert

1. Write to `memory/research/market-structure/{YYYY-MM-DD}.json`
2. Alert analyst on markets with deteriorating liquidity (>30% drop)
3. Alert guardian on markets showing signs of manipulation
4. Notify on new arbitrage opportunities >10bps

### Anti-Patterns

- Do NOT confuse TVL with tradeable liquidity. Focus on active pools.
- Do NOT assume CEX data represents the full market. Solana is DEX-heavy.
- Do NOT make trading recommendations. Report structure, not direction.

### Exit Codes

- `SKILL_OK` — market structure analysis complete
- `SKILL_PARTIAL` — some venues unavailable
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: market-structure — {N} markets analyzed`
