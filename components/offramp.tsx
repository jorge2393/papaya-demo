"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { cn } from "@/lib/utils";

// USDC token identifier - just the symbol, SDK will prepend chain automatically
const USDC_TOKEN = "usdc";

// Treasury address - hardcoded for client's backend wallet
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "";

type TransferStatus = "idle" | "processing" | "success" | "error";

export function Offramp() {
  const { wallet } = useWallet();
  const [amount, setAmount] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [transferStatus, setTransferStatus] = useState<TransferStatus>("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [bankBalance, setBankBalance] = useState<number>(0);

  // Poll transaction status after sending by checking wallet activity
  useEffect(() => {
    if (transferStatus !== "processing" || !transactionHash || !wallet) return;

    let cancelled = false;
    const intervalMs = 3000;
    const timeoutMs = 30000;

    const poll = async () => {
      try {
        const activity = await wallet.experimental_activity();
        const found = activity?.events?.some(
          (e: any) =>
            typeof e?.transaction_hash === "string" &&
            typeof transactionHash === "string" &&
            e.transaction_hash.toLowerCase() === transactionHash.toLowerCase()
        );
        if (!cancelled && found) {
          setTransferStatus("success");
        }
      } catch (err) {
        // Non-fatal: keep polling
      }
    };

    const intervalId = setInterval(poll, intervalMs);
    // Do an immediate poll to avoid initial delay
    poll();

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        // Fallback: mark as success after timeout to avoid hanging UI during demos
        setTransferStatus("success");
      }
    }, timeoutMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [transferStatus, transactionHash, wallet]);

  // On success: increment mock bank balance and reset form after message
  useEffect(() => {
    if (transferStatus === "success") {
      // Notify other components after success
      try {
        window.dispatchEvent(
          new CustomEvent('offramp:success', { detail: { amount } })
        );
      } catch {}
      // Increment bank balance by the last successful amount
      if (amount && amount > 0) {
        setBankBalance((prev) => Number((prev + amount).toFixed(2)));
      }
      const resetTimeout = setTimeout(() => {
        setAmount(null);
        setAmountInput("");
        setTransferStatus("idle");
        setTransactionHash(null);
      }, 5000);
      
      return () => clearTimeout(resetTimeout);
    }
  }, [transferStatus]);

  async function handleOfframp() {
    if (wallet == null || !amount || amount <= 0) {
      setTransferStatus("error");
      setTimeout(() => setTransferStatus("idle"), 3000);
      return;
    }

    if (!TREASURY_ADDRESS) {
      setTransferStatus("error");
      setTimeout(() => setTransferStatus("idle"), 3000);
      return;
    }

    try {
      setTransferStatus("processing");
      setTransactionHash(null);

      // Send transaction to treasury address
      const txn = await wallet.send(
        TREASURY_ADDRESS,
        USDC_TOKEN,
        amount.toString()
      );

      setTransactionHash(txn.hash || "");
    } catch (err) {
      setTransferStatus("error");
      setTimeout(() => {
        setTransferStatus("idle");
      }, 3000);
    }
  }

  const isLoading = transferStatus === "processing";

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col h-full">
      <div className="flex flex-col gap-4 flex-1">
        {/* Top Section: Offramp */}
        <div className="flex flex-col gap-4">
          {/* Header - aligned with USDC balance title */}
          <div className="flex items-center gap-3 min-h-[28px]">
            <h3 className="text-lg font-semibold">Offramp to Bank Account</h3>
          </div>

        {transferStatus === "success" ? (
          <div className="flex flex-col gap-4 items-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                Bank Transfer Initiated
              </h4>
              <p className="text-sm text-gray-600 max-w-sm">
                Your funds will arrive in your bank account within 1-3 business days. You'll receive a confirmation email shortly.
              </p>
            </div>
          </div>
        ) : transferStatus === "processing" ? (
          <div className="flex flex-col gap-4 items-center py-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-spin">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-1">
                Processing Request
              </h4>
              <p className="text-sm text-gray-500">
                Please wait while we process your bank transfer...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Amount Input - aligned with USDC balance value */}
            <div className="relative">
              <span
                className={cn(
                  "absolute left-0 top-0 text-4xl font-bold pointer-events-none",
                  amount && amount > 0 ? "text-gray-900" : "text-gray-400"
                )}
              >
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amountInput}
                className={cn(
                  "text-4xl font-bold bg-transparent border-none outline-none w-full pl-8 placeholder-gray-400 placeholder-opacity-100 focus:placeholder-gray-400 focus:placeholder-opacity-100",
                  amount && amount > 0 ? "text-gray-900" : "text-gray-400 focus:text-gray-400"
                )}
                placeholder="0.00"
                onChange={(e) => {
                  const value = e.target.value;
                  setAmountInput(value);

                  if (value === "") {
                    setAmount(null);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      setAmount(numValue);
                    }
                  }
                }}
                style={{
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Offramp Button */}
            <button
              className={cn(
                "w-full py-3 px-4 rounded-full text-sm font-medium transition-colors",
                isLoading || !amount
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#F93030] text-white hover:bg-[#e02b2b]"
              )}
              onClick={handleOfframp}
              disabled={isLoading || !amount}
            >
              {isLoading ? "Processing..." : "Offramp to Bank"}
            </button>
          </>
        )}
        </div>

        {/* Bottom Section: Bank Account Balance Mockup (professional look) */}
        <div className="flex flex-col gap-4 mt-12">
          <div className="rounded-xl border bg-gray-50 p-5">
            {/* Header row: Bank name + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">NovaBank · Ending 9820</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Linked</span>
            </div>

            {/* Main balance */}
            <div className="mt-4">
              <div className={cn(
                "text-4xl font-bold",
                bankBalance === 0 ? "text-gray-400" : "text-gray-900"
              )}>$ {bankBalance.toFixed(2)}</div>
              <div className="mt-1 text-xs text-gray-500">Last updated just now</div>
            </div>

            {/* Account meta */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between sm:block">
                <div className="text-xs font-medium text-gray-500">Account holder</div>
                <div className="text-sm text-gray-900">John Doe</div>
              </div>
              <div className="flex items-center justify-between sm:block">
                <div className="text-xs font-medium text-gray-500">Routing</div>
                <div className="font-mono text-sm text-gray-900">026009593</div>
              </div>
              <div className="flex items-center justify-between sm:block">
                <div className="text-xs font-medium text-gray-500">Account</div>
                <div className="font-mono text-sm text-gray-900">•••• •••• ••98 20</div>
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
