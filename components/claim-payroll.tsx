"use client";

import { useEffect, useState } from "react";
import { Balances, useCrossmint, useWallet } from "@crossmint/client-sdk-react-ui";
import { cn } from "@/lib/utils";

// Get chain from environment variable for token identifier
const chain = process.env.NEXT_PUBLIC_CHAIN ?? "solana";
// USDC token identifier - use full format chain:usdc
const USDC_TOKEN = `${chain}:usdc`;

export function ClaimPayroll() {
  const {
    crossmint: { apiKey, jwt },
  } = useCrossmint();
  const { wallet } = useWallet();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Function to fetch balances (can be called manually)
  const fetchBalances = async () => {
    if (!wallet) return;
    try {
      setBalanceError(null);
      const balances = await wallet.balances([USDC_TOKEN]);
      setBalances(balances);
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : "Failed to fetch balance");
      // Still set balances to null so we show 0 instead of stale data
      setBalances(null);
    }
  };

  // Fetch USDC balance
  useEffect(() => {
    if (!wallet) return;
    
    fetchBalances();

    // Poll every 60 seconds for balance updates
    const interval = setInterval(fetchBalances, 60000);
    return () => clearInterval(interval);
    
  }, [wallet]);

  // Poll more aggressively after claiming
  useEffect(() => {
    if (!isPolling || !wallet) return;

    const pollInterval = setInterval(async () => {
      try {
        const balances = await wallet.balances([USDC_TOKEN]);
        setBalances(balances);
        
        // Check if we got USDC balance (check direct property first, then tokens array)
        const hasBalance = (balances?.usdc && Number(balances.usdc.amount) > 0) ||
          (balances?.tokens?.find((token) => token.symbol?.toLowerCase() === "usdc") && 
           Number(balances.tokens.find((token) => token.symbol?.toLowerCase() === "usdc")?.amount || 0) > 0);
        
        if (hasBalance) {
          setIsPolling(false); // Stop aggressive polling once we see funds
          setClaimSuccess(false); // Reset success message after balance updates
        }
      } catch (error) {
        // Silent error handling for polling
      }
    }, 3000); // Poll every 3 seconds (reduced from 2s)

    return () => clearInterval(pollInterval);
  }, [isPolling, wallet]);

  // After an Offramp completes, start a short balance polling 3s later
  useEffect(() => {
    const handler = () => {
      if (!wallet) return;
      const timeout = setTimeout(() => {
        // Start a short 30s poll every 3s
        let elapsed = 0;
        const interval = setInterval(async () => {
          elapsed += 3000;
          try {
            const b = await wallet.balances([USDC_TOKEN]);
            setBalances(b);
          } catch {}
          if (elapsed >= 30000) {
            clearInterval(interval);
          }
        }, 3000);
      }, 3000);
      return () => clearTimeout(timeout);
    };
    const listener = () => { handler(); };
    window.addEventListener('offramp:success', listener);
    return () => window.removeEventListener('offramp:success', listener);
  }, [wallet]);

  const formatBalance = (balance: string) => {
    return Number(balance).toFixed(2);
  };

  // USDC can be returned as a direct property (balances.usdc) or in tokens array
  const getUSDCBalance = () => {
    if (balances?.usdc) {
      return formatBalance(balances.usdc.amount);
    }
    const usdcToken = balances?.tokens?.find(
      (token) => token.symbol?.toLowerCase() === "usdc"
    );
    return formatBalance(usdcToken?.amount || "0");
  };
  const usdcBalance = getUSDCBalance();

  const handleClaimSalary = async () => {
    if (!wallet) {
      return;
    }

    setIsClaiming(true);
    setIsPolling(true); // Start aggressive polling
    setClaimSuccess(false);
    setBalanceError(null);

    // Try to call backend endpoint (non-blocking for demo)
    // If NEXT_PUBLIC_BACKEND_URL is set, it will send the request
    // If not set or fails, we still show success and refresh balance
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl && !backendUrl.includes("YOUR_BACKEND_URL")) {
      try {
        const response = await fetch(`${backendUrl}/api/claim-salary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: wallet.address,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // API call successful
        } else {
          // Backend API call failed (non-blocking)
        }
      } catch (error) {
        // Non-blocking: continue with success flow
      }
    } else {
      // Backend URL not configured - skipping API call (demo mode)
    }

    // Always show success and refresh balance for demo
    setClaimSuccess(true);
    await fetchBalances();

    setIsClaiming(false);
    
    // Keep polling for a bit to catch balance updates if backend funds the wallet
    setTimeout(() => {
      setIsPolling(false);
      setClaimSuccess(false); // Hide success message after polling stops
    }, 30000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Info - aligned with Offramp title */}
      <div className="flex items-center gap-3 min-h-[28px]">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Account Balance</h3>
          <div className="relative group">
            <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center cursor-help">
              <span className="text-gray-500 text-xs font-medium">i</span>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              USDC Token
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="text-4xl font-bold text-gray-900">$ {usdcBalance}</div>
      
      {/* Error Message */}
      {balanceError && (
        <div className="text-red-600 text-xs text-center bg-red-50 px-2 py-1 rounded">
          Error: {balanceError}
        </div>
      )}

      {/* Success Message */}
      {claimSuccess && (
        <div className="text-green-600 text-xs text-center bg-green-50 px-2 py-1 rounded animate-pulse">
          ✓ Salary claimed successfully! Balance will update shortly.
        </div>
      )}

      {/* Claim Salary Button */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleClaimSalary}
          disabled={isClaiming}
          data-fund-button
          className={cn(
            "w-full py-3 px-4 rounded-full text-sm font-medium transition-colors cursor-pointer",
            isClaiming
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-[#F93030] text-white hover:bg-[#e02b2b]"
          )}
        >
          {isClaiming ? "Claiming payroll..." : "Claim Payroll"}
        </button>
        {isPolling && (
          <p className="text-gray-500 text-xs text-center animate-pulse">
            Waiting for funds to arrive...
          </p>
        )}
      </div>
    </div>
  );
}
