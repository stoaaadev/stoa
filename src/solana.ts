// stoa/src/solana.ts — Solana SDK verification layer
// Provides independent on-chain verification of LLM-claimed actions.

import {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createLogger } from "./logger.js";
import { consumeToken, waitForToken } from "./ratelimit.js";

const log = createLogger("solana");

// --- Connection Management ---

let _connection: Connection | null = null;

function detectNetwork(): "mainnet-beta" | "devnet" | "testnet" {
  const explicit = process.env.STOA_NETWORK;
  if (explicit === "devnet") return "devnet";
  if (explicit === "testnet") return "testnet";

  const rpcUrl = process.env.SOLANA_RPC_URL || "";
  if (rpcUrl.includes("devnet")) return "devnet";
  if (rpcUrl.includes("testnet")) return "testnet";

  return "mainnet-beta";
}

export function getConnection(): Connection {
  if (_connection) return _connection;

  const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl(detectNetwork());
  _connection = new Connection(rpcUrl, "confirmed");
  log.info("Solana connection established", { rpc: rpcUrl.substring(0, 40) + "...", network: detectNetwork() });
  return _connection;
}

export function getNetwork(): string {
  return detectNetwork();
}

// --- Wallet ---

let _keypair: Keypair | null = null;

export function getKeypair(): Keypair {
  if (_keypair) return _keypair;

  const privKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privKey) {
    throw new Error("SOLANA_PRIVATE_KEY env var not set. Cannot load wallet keypair.");
  }

  try {
    const decoded = decodeBase58(privKey);
    _keypair = Keypair.fromSecretKey(decoded);
    log.info("Wallet keypair loaded", { publicKey: _keypair.publicKey.toBase58().substring(0, 8) + "..." });
    return _keypair;
  } catch (e) {
    throw new Error(`Failed to decode SOLANA_PRIVATE_KEY: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function getPublicKey(): PublicKey {
  return getKeypair().publicKey;
}

function decodeBase58(str: string): Uint8Array {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const ALPHABET_MAP = new Map<string, number>();
  for (let i = 0; i < ALPHABET.length; i++) {
    ALPHABET_MAP.set(ALPHABET[i], i);
  }

  const bytes: number[] = [0];
  for (const char of str) {
    const value = ALPHABET_MAP.get(char);
    if (value === undefined) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Handle leading zeros
  for (const char of str) {
    if (char === "1") {
      bytes.push(0);
    } else {
      break;
    }
  }

  return new Uint8Array(bytes.reverse());
}

// --- Balance Checks ---

export async function getSOLBalance(address?: string): Promise<number> {
  if (!consumeToken("solana_rpc")) {
    log.warn("Rate limited on Solana RPC for getSOLBalance");
    return -1;
  }

  try {
    const pubkey = address
      ? new PublicKey(address)
      : getPublicKey();

    const connection = getConnection();
    const lamports = await connection.getBalance(pubkey);
    const sol = lamports / LAMPORTS_PER_SOL;
    log.debug("SOL balance fetched", { address: pubkey.toBase58().substring(0, 8) + "...", sol });
    return sol;
  } catch (e) {
    log.error("Failed to get SOL balance", { error: e instanceof Error ? e.message : String(e) });
    return -1;
  }
}

export interface TokenAccountInfo {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export async function getTokenBalance(mintAddress: string, ownerAddress?: string): Promise<number> {
  if (!consumeToken("solana_rpc")) {
    log.warn("Rate limited on Solana RPC for getTokenBalance");
    return -1;
  }

  try {
    const owner = ownerAddress
      ? new PublicKey(ownerAddress)
      : getPublicKey();
    const mint = new PublicKey(mintAddress);
    const connection = getConnection();

    // Find associated token account
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    const info = tokenAccounts.value[0].account.data.parsed.info;
    const uiAmount = info.tokenAmount.uiAmount ?? 0;
    log.debug("Token balance fetched", { mint: mintAddress.substring(0, 8) + "...", uiAmount });
    return uiAmount;
  } catch (e) {
    log.error("Failed to get token balance", { error: e instanceof Error ? e.message : String(e), mint: mintAddress });
    return -1;
  }
}

export interface PortfolioSnapshot {
  timestamp: string;
  solBalance: number;
  solLamports: number;
  tokenAccounts: TokenAccountInfo[];
}

export async function getPortfolioSnapshot(): Promise<PortfolioSnapshot | null> {
  if (!consumeToken("solana_rpc")) {
    log.warn("Rate limited on Solana RPC for getPortfolioSnapshot");
    return null;
  }

  try {
    const pubkey = getPublicKey();
    const connection = getConnection();

    const [lamports, tokenResp] = await Promise.all([
      connection.getBalance(pubkey),
      connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }),
    ]);

    const tokenAccounts: TokenAccountInfo[] = tokenResp.value.map((ta) => {
      const info = ta.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: Number(info.tokenAmount.amount),
        decimals: info.tokenAmount.decimals,
        uiAmount: info.tokenAmount.uiAmount ?? 0,
      };
    });

    const snapshot: PortfolioSnapshot = {
      timestamp: new Date().toISOString(),
      solBalance: lamports / LAMPORTS_PER_SOL,
      solLamports: lamports,
      tokenAccounts,
    };

    log.info("Portfolio snapshot taken", {
      sol: snapshot.solBalance,
      tokenCount: tokenAccounts.length,
    });

    return snapshot;
  } catch (e) {
    log.error("Failed to get portfolio snapshot", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

// --- Transaction Verification ---

export interface TransactionVerification {
  exists: boolean;
  signature: string;
  slot?: number;
  blockTime?: number | null;
  fee?: number;
  status: "confirmed" | "finalized" | "processed" | "failed" | "not_found";
  error?: string | null;
}

export async function verifyTransaction(signature: string): Promise<TransactionVerification> {
  if (!consumeToken("solana_rpc")) {
    log.warn("Rate limited on Solana RPC for verifyTransaction");
    return { exists: false, signature, status: "not_found", error: "rate_limited" };
  }

  try {
    const connection = getConnection();
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      log.info("Transaction not found", { signature: signature.substring(0, 16) + "..." });
      return { exists: false, signature, status: "not_found" };
    }

    const error = tx.meta?.err ? JSON.stringify(tx.meta.err) : null;
    const result: TransactionVerification = {
      exists: true,
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime,
      fee: tx.meta?.fee,
      status: error ? "failed" : "confirmed",
      error,
    };

    log.info("Transaction verified", {
      signature: signature.substring(0, 16) + "...",
      status: result.status,
      slot: result.slot,
    });

    return result;
  } catch (e) {
    log.error("Failed to verify transaction", { error: e instanceof Error ? e.message : String(e) });
    return { exists: false, signature, status: "not_found", error: e instanceof Error ? e.message : String(e) };
  }
}

export async function waitForConfirmation(
  signature: string,
  timeout: number = 60000
): Promise<TransactionVerification> {
  const startTime = Date.now();
  const pollInterval = 2000;

  log.info("Waiting for transaction confirmation", { signature: signature.substring(0, 16) + "...", timeout });

  while (Date.now() - startTime < timeout) {
    const result = await verifyTransaction(signature);
    if (result.exists && result.status !== "not_found") {
      return result;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  log.warn("Transaction confirmation timed out", { signature: signature.substring(0, 16) + "...", timeout });
  return { exists: false, signature, status: "not_found", error: "timeout" };
}

// --- Jupiter Swap Integration ---

const JUPITER_API = "https://quote-api.jup.ag/v6";

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: unknown[];
  raw: unknown;
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  slippageBps: number = 50
): Promise<JupiterQuote | null> {
  if (!consumeToken("jupiter")) {
    log.warn("Rate limited on Jupiter API");
    return null;
  }

  try {
    const url = `${JUPITER_API}/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${amountLamports}&slippageBps=${slippageBps}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      log.error("Jupiter quote HTTP error", { status: response.status });
      return null;
    }

    const parsed = await response.json() as Record<string, unknown>;

    if (parsed.error) {
      log.error("Jupiter quote error", { error: parsed.error });
      return null;
    }

    const quote: JupiterQuote = {
      inputMint: parsed.inputMint as string,
      outputMint: parsed.outputMint as string,
      inAmount: parsed.inAmount as string,
      outAmount: parsed.outAmount as string,
      otherAmountThreshold: parsed.otherAmountThreshold as string,
      swapMode: parsed.swapMode as string,
      slippageBps: parsed.slippageBps as number,
      priceImpactPct: parsed.priceImpactPct as string,
      routePlan: (parsed.routePlan as unknown[]) || [],
      raw: parsed,
    };

    log.info("Jupiter quote received", {
      inputMint: inputMint.substring(0, 8) + "...",
      outputMint: outputMint.substring(0, 8) + "...",
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpact: quote.priceImpactPct,
    });

    return quote;
  } catch (e) {
    log.error("Failed to get Jupiter quote", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

export async function executeSwap(quoteResponse: object): Promise<string | null> {
  if (!consumeToken("jupiter")) {
    log.warn("Rate limited on Jupiter API for swap execution");
    return null;
  }

  try {
    const keypair = getKeypair();
    const connection = getConnection();

    // Request swap transaction from Jupiter using native fetch (no shell injection risk)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const swapResponse = await fetch(`${JUPITER_API}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: keypair.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!swapResponse.ok) {
      log.error("Jupiter swap HTTP error", { status: swapResponse.status });
      return null;
    }

    const swapData = await swapResponse.json() as Record<string, unknown>;

    if (swapData.error) {
      log.error("Jupiter swap API error", { error: swapData.error });
      return null;
    }

    // Deserialize and sign the transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction as string, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    transaction.sign([keypair]);

    // Send the signed transaction
    const rawTransaction = transaction.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      maxRetries: 2,
    });

    log.info("Swap transaction sent", { signature: signature.substring(0, 16) + "..." });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, "confirmed");

    if (confirmation.value.err) {
      log.error("Swap transaction failed on-chain", {
        signature,
        error: JSON.stringify(confirmation.value.err),
      });
      return null;
    }

    log.info("Swap transaction confirmed", { signature });
    return signature;
  } catch (e) {
    log.error("Failed to execute swap", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

// --- Devnet Support ---

export async function requestAirdrop(amount: number = 1): Promise<string | null> {
  const network = detectNetwork();
  if (network === "mainnet-beta") {
    log.error("Airdrop not available on mainnet");
    throw new Error("Airdrop is only available on devnet/testnet");
  }

  if (!consumeToken("solana_rpc")) {
    log.warn("Rate limited on Solana RPC for airdrop");
    return null;
  }

  try {
    const connection = getConnection();
    const pubkey = getPublicKey();
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    log.info("Requesting airdrop", { amount, network, address: pubkey.toBase58().substring(0, 8) + "..." });

    const signature = await connection.requestAirdrop(pubkey, lamports);

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");

    log.info("Airdrop confirmed", { signature, amount });
    return signature;
  } catch (e) {
    log.error("Airdrop failed", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

// --- Safety Checks ---

export interface PreflightResult {
  approved: boolean;
  reason?: string;
  balanceSOL?: number;
  network: string;
}

export async function preflightCheck(action: { type: string; amountUSD: number }): Promise<PreflightResult> {
  const network = detectNetwork();

  // Check if system is halted (guardian halt check)
  try {
    const { existsSync, readFileSync } = await import("fs");
    const meshFile = "memory/mesh/executor.json";
    if (existsSync(meshFile)) {
      const messages = JSON.parse(readFileSync(meshFile, "utf-8"));
      const haltMessages = Array.isArray(messages)
        ? messages.filter((m: { type?: string; _acknowledged?: boolean }) => m.type === "halt" && !m._acknowledged)
        : [];
      if (haltMessages.length > 0) {
        log.warn("System is halted by guardian", { action: action.type });
        return { approved: false, reason: "System halted by guardian", network };
      }
    }
  } catch {
    // Mesh file missing or unparseable — not a blocker
  }

  // Check balance sufficiency
  try {
    const balance = await getSOLBalance();
    if (balance < 0) {
      return { approved: false, reason: "Unable to fetch balance", network };
    }

    // Basic sanity: ensure we have at least 0.01 SOL for fees
    if (balance < 0.01) {
      log.warn("Insufficient SOL for transaction fees", { balance });
      return { approved: false, reason: "Insufficient SOL for fees", balanceSOL: balance, network };
    }

    // For large actions, apply extra caution
    if (action.amountUSD > 1000 && network === "mainnet-beta") {
      log.warn("Large action on mainnet requires extra verification", {
        type: action.type,
        amountUSD: action.amountUSD,
      });
    }

    log.info("Preflight check passed", { action: action.type, balanceSOL: balance });
    return { approved: true, balanceSOL: balance, network };
  } catch (e) {
    log.error("Preflight check failed", { error: e instanceof Error ? e.message : String(e) });
    return { approved: false, reason: e instanceof Error ? e.message : String(e), network };
  }
}

export interface PostflightResult {
  verified: boolean;
  signature: string;
  status: string;
  slot?: number;
  fee?: number;
  error?: string | null;
}

export async function postflightVerify(expectedTx: string): Promise<PostflightResult> {
  if (!expectedTx || expectedTx.length < 40) {
    log.warn("Invalid transaction signature provided for postflight", { signature: expectedTx });
    return { verified: false, signature: expectedTx, status: "invalid_signature", error: "Signature too short or empty" };
  }

  log.info("Postflight verification starting", { signature: expectedTx.substring(0, 16) + "..." });

  // Try up to 3 times with small delays to account for propagation
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await verifyTransaction(expectedTx);

    if (result.exists) {
      const postflight: PostflightResult = {
        verified: result.status !== "failed",
        signature: expectedTx,
        status: result.status,
        slot: result.slot,
        fee: result.fee,
        error: result.error,
      };

      if (postflight.verified) {
        log.info("Postflight verification passed", { signature: expectedTx.substring(0, 16) + "...", slot: result.slot });
      } else {
        log.error("Postflight verification: transaction exists but failed", {
          signature: expectedTx.substring(0, 16) + "...",
          error: result.error,
        });
      }

      return postflight;
    }

    // Wait before retry
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  log.error("Postflight verification: transaction not found on-chain", {
    signature: expectedTx.substring(0, 16) + "...",
  });

  return {
    verified: false,
    signature: expectedTx,
    status: "not_found",
    error: "Transaction not found on-chain after 3 attempts",
  };
}
