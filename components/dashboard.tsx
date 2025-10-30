import { useState, useEffect } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import Image from "next/image";
import { Offramp } from "./offramp";
import { VirtualCard } from "./virtual-card";
import { TransactionHistory } from "./transaction-history";
import { AuthLogout } from "./auth-logout";
import { ClaimPayroll } from "./claim-payroll";
import { Footer } from "./footer";

export function Dashboard() {
  const { wallet } = useWallet();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedDepositAddress, setCopiedDepositAddress] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);

  const walletAddress = wallet?.address;

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyDepositAddress = async () => {
    if (!depositAddress) return;
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopiedDepositAddress(true);
      setTimeout(() => setCopiedDepositAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Do NOT fetch or cache Rain contract. Only update when the card creation flow publishes it.
  useEffect(() => {
    setDepositAddress(null);
    const onContract = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (typeof ce.detail === 'string') setDepositAddress(ce.detail);
    };
    window.addEventListener('rain:depositAddress', onContract as EventListener);
    return () => window.removeEventListener('rain:depositAddress', onContract as EventListener);
  }, [wallet?.address]);

  return (
    <div className="min-h-screen bg-gray-50 content-center">
      <div className="w-full max-w-[1600px] mx-auto px-4 pt-3 pb-6 sm:pt-5">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/Papaya%20Global_idZ-ZwDhhe_0.svg"
            alt="Papaya Global logo"
            priority
            width={260}
            height={85}
            className="mb-4"
          />
          <h1 className="text-2xl font-semibold mb-2"></h1>
          <p className="text-gray-600 text-sm">
            
          </p>
        </div>

        {/* Dashboard Header */}
        <div className="flex flex-col gap-4 bg-white rounded-2xl border shadow-sm p-6 pb-9">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Contractor Dashboard</h2>
            <AuthLogout />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* USDC Balance & Wallet Details Column */}
            <div className="flex flex-col gap-6">
              {/* USDC Balance Section */}
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <ClaimPayroll />
              </div>

              {/* Wallet Details Section */}
              <div className="bg-white rounded-2xl border shadow-sm p-6 flex-1 min-h-[260px]">
                <h3 className="text-lg font-semibold mb-7">Wallet details</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Address
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-900 overflow-auto">
                        {walletAddress
                          ? `${walletAddress.slice(
                              0,
                              6
                            )}...${walletAddress.slice(-6)}`
                          : ""}
                      </span>
                      <button
                        onClick={handleCopyAddress}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {copiedAddress ? (
                          <Image
                            src="/circle-check-big.svg"
                            alt="Copied"
                            width={16}
                            height={16}
                          />
                        ) : (
                          <Image
                            src="/copy.svg"
                            alt="Copy"
                            width={16}
                            height={16}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Owner
                    </span>
                    <span className="text-sm text-gray-900 overflow-auto">
                      {wallet?.owner?.replace(/^[^:]*:/, "") || "Current User"}
                    </span>
                  </div>
                   <div className="flex items-center gap-2 justify-between">
                     <span className="text-sm font-medium text-gray-500">
                       Chain
                     </span>
                     <span className="text-sm text-gray-900 capitalize text-nowrap overflow-auto">
                       {wallet?.chain}
                     </span>
                   </div>

                   <div className="flex items-center gap-2 justify-between">
                     <span className="text-sm font-medium text-gray-500">
                       Rain Contract
                     </span>
                     <div className="flex items-center gap-2">
                       <span className="font-mono text-sm text-gray-900 overflow-auto">
                         {depositAddress
                           ? `${depositAddress.slice(0, 6)}...${depositAddress.slice(-6)}`
                           : "N/A"}
                       </span>
                       {depositAddress && (
                         <button
                           onClick={handleCopyDepositAddress}
                           className="text-gray-500 hover:text-gray-700 transition-colors"
                         >
                           {copiedDepositAddress ? (
                             <Image
                               src="/circle-check-big.svg"
                               alt="Copied"
                               width={16}
                               height={16}
                             />
                           ) : (
                             <Image
                               src="/copy.svg"
                               alt="Copy"
                               width={16}
                               height={16}
                             />
                           )}
                         </button>
                       )}
                     </div>
                   </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <Offramp />
            </div>
            <div className="flex-1">
              <VirtualCard />
            </div>
            <div className="flex-1">
              <TransactionHistory />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Footer />
      </div>
    </div>
  );
}
