# Axon

A cyberpunk-themed Next.js 15 application that allows users to mint AI-powered digital personas as ERC-721 NFTs on ZetaChain Athens Testnet.

## Features

- 🧠 **AI Persona Creation**: Upload personal data and create an AI that speaks in your voice using Google Gemini and LangChain
- ⚡ **ZetaChain NFTs**: Mint your persona as an ERC-721 NFT on ZetaChain Athens Testnet
- 🔗 **Cross-Chain Asset Linking**: Connect NFTs from Ethereum, Polygon, and Solana to your persona
- 📁 **IPFS Storage**: Decentralized storage of persona data via Pinata
- 💬 **AI Chat**: Chat with your AI persona using retrieval-augmented generation (RAG)
- 🎨 **Cyberpunk UI**: Neon-themed glassmorphism design with animations

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Blockchain**: wagmi v2, RainbowKit, ethers v6, viem
- **AI**: LangChain.js, Google Gemini, Chroma vector store
- **Storage**: Pinata IPFS, local vector persistence
- **Validation**: Zod, next-safe-action

## Getting Started

### Prerequisites

1. **ZetaChain Athens Testnet Setup**:

   - Add ZetaChain Athens to your wallet: [Chainlist](https://chainlist.org/chain/7001)
   - Get testnet ZETA from the [faucet](https://www.zetachain.com/docs/reference/apps/faucet/)

2. **Required API Keys**:
   - WalletConnect Project ID: [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Pinata JWT: [Pinata Dashboard](https://app.pinata.cloud/)
   - Google AI API Key: [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd Axon
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Copy environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Fill in your environment variables in `.env.local`:
   \`\`\`env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_OMNISOUL_ADDRESS=your_deployed_contract_address
   PINATA_JWT=your_pinata_jwt_token
   GOOGLE_API_KEY=your_google_ai_api_key
   \`\`\`

5. Deploy the OmniSoul contract to ZetaChain Athens and update the contract address in your environment variables.

6. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Smart Contract

The application expects an OmniSoul ERC-721 contract deployed on ZetaChain Athens with the following interface:

```solidity
function mintOmniSoul(address to, string tokenURI) external returns (uint256 tokenId);
function setTokenURI(uint256 tokenId, string tokenURI) external;
function tokenURI(uint256 tokenId) external view returns (string);
function linkCrossChainAsset(uint256 tokenId, string chainName, address assetAddress, uint256 assetId) external;
function ownerOf(uint256 tokenId) external view returns (address);
```
