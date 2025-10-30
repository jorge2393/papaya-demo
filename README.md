

<div align="center">
<img width="200" alt="Image" src="https://github.com/user-attachments/assets/8b617791-cd37-4a5a-8695-a7c9018b7c70" />
<br>
<br>
<h1>Papaya Contractor Demo</h1>

<br>
<br>
</div>

## Introduction
This quickstart demonstrates a simple payroll wallet built with Crossmint and Rain. Users sign in with email to auto‑create a smart wallet, claim payroll (backend funds the wallet), offramp to a treasury, or create and fund a Rain virtual card—then view balances, activity, and securely reveal card details.

**Features:**
- **Account Management**: View USDC balance on Base Sepolia
- **Salary Claiming**: One-click salary claiming with backend integration
- **Bank Offramp**: Send USDC to treasury with bank transfer processing
- **Virtual Cards**: Create and manage Rain-powered virtual cards
- **Card Funding**: Fund virtual cards with USDC
- **Card Details**: Securely reveal PAN and CVC using RSA/AES encryption
- **Transaction History**: View recent wallet activity


## Setup
1. Clone the repository and navigate to the project folder:
```bash
git clone https://github.com/jorge2393/papaya-demo.git && cd wallets-quickstart
```

2. Install all dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up the environment variables:
```bash
cp .env.example .env
```

4. Configure the required environment variables in your `.env` file:

**Required Variables:**
- `NEXT_PUBLIC_CROSSMINT_API_KEY`: Get from [Crossmint Dashboard](https://docs.crossmint.com/introduction/platform/api-keys/client-side)
- `NEXT_PUBLIC_CHAIN`: Set to `base-sepolia` for Base Sepolia testnet
- `RAIN_API_KEY`: Get from [Rain Dashboard](https://rain.xyz) for virtual card functionality
- `NEXT_PUBLIC_TREASURY_ADDRESS`: Treasury wallet address for offramp functionality

**Optional Variables:**
- `NEXT_PUBLIC_BACKEND_URL`: Backend URL for salary claiming (defaults to demo mode)
- `RAIN_API_BASE_URL`: Rain API base URL (defaults to `https://api-dev.raincards.xyz/v1`)

**API Key Scopes Required:**
- Crossmint: `users.create`, `users.read`, `wallets.read`, `wallets.create`, `wallets:transactions.create`, `wallets:transactions.sign`, `wallets:balance.read`, `wallets.fund`

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


## User Flow


### 0) Auth and Wallet Creation
- User logs in with email and verifies with OTP 1.
- Crossmint issues a JWT for the session.
- The app accesses this token from the Crossmint React SDK via `useCrossmint()` and uses it to authorize wallet operations against Crossmint APIs on behalf of the user.
- On first login, a smart wallet is created automatically with an email-based signer.


### 1) Claim Payroll (Funding Wallet from Backend)
- User clicks “Claim Payroll”.
- Frontend sends the user’s wallet address to your backend (`/api/claim-salary`).
- Your backend submits a blockchain transaction on Base Sepolia using:
  - Crossmint API Signer (recommended for the demo), or
  - A server-managed keypair signer (alternative).

### 2) Offramp to Bank Account (Treasury)
- User enters an amount and clicks “Offramp to Bank”.
- A transaction is sent from the user’s smart wallet back to the treasury address (`NEXT_PUBLIC_TREASURY_ADDRESS`).
- First transaction requires an OTP flow to authorize the signature; subsequent will not. We’re working toward skipping OTP for the first one as well.
- UI shows “Processing Request”, confirms when on-chain success is detected, then resets.

### 3) Virtual Card via Rain
1. KYC (demo-bypassed): Create a Rain user (returns `userId`).
2. Create Rain smart contract for the user on Base Sepolia.
3. Issue a virtual card for the user (status active).
4. Fund the card by sending USDC from the user’s smart wallet to the contract’s deposit address.
5. Poll Rain endpoints to reflect spending power/balance on the card.
6. Reveal card details (PAN/CVC) via secure RSA public-key handshake + AES-128-GCM decryption, performed on server-side API routes.



### Environment Summary
- `NEXT_PUBLIC_CROSSMINT_API_KEY`,
- `NEXT_PUBLIC_CHAIN` (Base Sepolia),
- `NEXT_PUBLIC_TREASURY_ADDRESS` (for offramp),
- `RAIN_API_KEY`,
- `NEXT_PUBLIC_BACKEND_URL` (optional - your server for Claim Payroll).

