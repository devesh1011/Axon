# 🌟 Axon: The Future of Cross-Chain NFT Identity

**Axon** is a decentralized platform that revolutionizes digital identity through cross-chain NFT verification, AI-powered persona generation, and seamless Web3 integration. Built on ZetaChain's omnichain infrastructure with production-grade smart contracts and real blockchain integrations.

## 🚀 What Makes Axon Special

### 🔗 True Cross-Chain NFT Verification

- **Production-Ready Integration**: Live connections to Ethereum, Polygon, BSC, Arbitrum, Optimism, and Solana mainnet/testnet
- **Real Blockchain Calls**: Direct RPC verification using ethers.js and @solana/web3.js
- **Universal Asset Linking**: Connect NFTs from any supported chain to your ZetaChain identity
- **Cryptographic Ownership Proof**: Secure verification with on-chain validation
- **Smart Contract Registry**: ZetaChain deployed contract at `0x52AfBb6160bd3694fE70f6836a8ed81ae599da8a`

### � Advanced AI Persona System

- **Context-Aware Generation**: AI creates unique personalities using Google Gemini with RAG technology
- **Vector Embeddings**: Sophisticated similarity search using Supabase vector store
- **Interactive Conversations**: Natural, engaging chat experiences with persona-specific knowledge
- **Dynamic Learning**: Personas evolve based on your expanding NFT collection
- **LangChain Integration**: Professional-grade AI pipeline with memory and context management

### 🎨 Production-Ready NFT Creation

- **Complete Minting Pipeline**: End-to-end NFT creation with metadata generation
- **IPFS Integration**: Decentralized storage via Pinata with custom gateway
- **Metadata Enrichment**: Automatic attribute generation and validation
- **ZetaChain Deployment**: Native omnichain NFT contracts with cross-chain capabilities

### 🌐 Infrastructure

- **Supabase Backend**: Production PostgreSQL with real-time capabilities
- **Type-Safe APIs**: 20+ Next.js API routes with comprehensive validation
- **RainbowKit Integration**: Professional wallet connection with multi-chain support
- **Rate Limiting**: Production-ready API protection and security measures

## 🏗️ Technical Architecture

### Frontend (`/frontend`)

- **Next.js 15.5.0**: Latest React framework with App Router and server components
- **TypeScript**: Complete type safety with comprehensive interfaces
- **Tailwind CSS 4.1.12**: Modern utility-first styling with cyberpunk theme
- **RainbowKit 2.2.8**: Advanced Web3 wallet integration with 6+ chain support
- **Framer Motion**: Smooth animations and micro-interactions
- **Supabase Client**: Real-time database interactions and vector operations

### Smart Contracts (`/contracts`)

- **OmniSoul.sol**: Production ERC-721 contract deployed on ZetaChain
- **OpenZeppelin 4.9.3**: Battle-tested security standards
- **Hardhat**: Professional development environment with TypeScript
- **ZetaChain Testnet**: Deployed at `0x52AfBb6160bd3694fE70f6836a8ed81ae599da8a`

### Backend Infrastructure

- **Supabase PostgreSQL**: Production database with vector extensions
- **IPFS/Pinata**: Decentralized storage with custom gateway at `coffee-urgent-crab-303.mypinata.cloud`
- **Google Gemini AI**: Advanced language model with function calling
- **LangChain**: RAG implementation with vector similarity search
- **Real RPC Endpoints**: Direct blockchain calls to mainnet/testnet networks

### API Architecture (`/frontend/app/api`)

- **NFT Creation**: `/api/nft/create` - Complete minting pipeline with Supabase integration
- **AI Chat**: `/api/ai/chat` - Persona conversations with RAG and rate limiting
- **Cross-Chain Verification**: `/api/omnisoul/verify-evm` & `/api/omnisoul/verify-solana`
- **IPFS Operations**: `/api/ipfs/upload` & `/api/ipfs/get` - Metadata management
- **AI Embeddings**: `/api/ai/embeddings` - Vector generation and storage

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/yarn
- **Git** for version control
- **ZetaChain testnet wallet** with ZETA tokens
- **Supabase account** for database and vector operations
- **Pinata account** for IPFS storage
- **Google AI Studio API key** for Gemini integration

### 1. Clone and Setup

```bash
git clone https://github.com/your-username/OmniSoul.git
cd OmniSoul

# Navigate to frontend (main application)
cd frontend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your credentials:

```bash
# In frontend directory
cp .env.example .env.local
```

Configure your `.env.local` with these essential variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# IPFS/Pinata Configuration
PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=coffee-urgent-crab-303.mypinata.cloud

# AI Configuration
GOOGLE_API_KEY=your_google_gemini_api_key

# Web3 Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_OMNISOUL_ADDRESS=0x52AfBb6160bd3694fE70f6836a8ed81ae599da8a

# Demo Mode (optional)
NEXT_PUBLIC_DEMO_MODE=false
```

### 3. Database Setup

Set up your Supabase database with the required tables:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables
CREATE TABLE nfts (
  id SERIAL PRIMARY KEY,
  token_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  owner_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE persona_embeddings (
  id SERIAL PRIMARY KEY,
  persona_key VARCHAR(255) UNIQUE NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wallet_profiles (
  wallet_address VARCHAR(42) PRIMARY KEY,
  profile_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE linked_assets (
  id SERIAL PRIMARY KEY,
  axon_token_id INTEGER NOT NULL,
  chain VARCHAR(50) NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  token_id VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  transaction_hash VARCHAR(66),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (axon_token_id) REFERENCES nfts(token_id)
);
```

### 4. Smart Contract Deployment (Optional)

If you want to deploy your own contract:

```bash
cd contracts
npm install

# Configure your private key in contracts/.env
echo "PRIVATE_KEY=your_private_key_here" > .env

# Deploy to ZetaChain testnet
npm run deploy:testnet
```

### 5. Start the Application

```bash
# In frontend directory
npm run dev
```

## 🎯 Core Features & Usage

### 🎨 NFT Creation & Minting

1. **Connect Wallet**: Use RainbowKit to connect your Web3 wallet
2. **Create Your Axon**: Fill out personal information, upload media, add memories
3. **AI Enhancement**: Our system automatically enriches your metadata with AI-generated attributes
4. **IPFS Storage**: Metadata is permanently stored on IPFS via Pinata
5. **Blockchain Minting**: Your NFT is minted on ZetaChain with omnichain capabilities

### 🤖 AI Persona Interaction

1. **Automatic Generation**: AI personas are created from your NFT metadata using vector embeddings
2. **Natural Conversations**: Chat with AI that knows your personal history and preferences
3. **Context Awareness**: Personas remember conversation history and learn from interactions
4. **RAG Technology**: Retrieval-Augmented Generation provides accurate, personalized responses

### 🔗 Cross-Chain Asset Linking

1. **Multi-Chain Support**: Connect NFTs from Ethereum, Polygon, BSC, Arbitrum, Optimism, and Solana
2. **Ownership Verification**: Real blockchain RPC calls verify your NFT ownership
3. **Asset Registry**: Linked assets are stored in your Axon's cross-chain portfolio
4. **Universal Identity**: One ZetaChain identity representing assets across all supported chains

### 📊 Profile Management

1. **Wallet Profiles**: Comprehensive user profiles stored in Supabase
2. **NFT Gallery**: View your complete NFT collection with IPFS metadata
3. **Cross-Chain Portfolio**: See all linked assets from different blockchains
4. **Activity Timeline**: Track your minting, linking, and interaction history

## 🔧 Advanced Configuration

### Supported Blockchain Networks

**EVM Chains:**

- Ethereum Mainnet/Sepolia
- Polygon Mainnet/Mumbai
- BSC Mainnet/Testnet
- Arbitrum One/Sepolia
- Optimism Mainnet/Sepolia

**Non-EVM Chains:**

- Solana Mainnet/Devnet

### IPFS Configuration

Using Pinata for production-grade IPFS storage:

- Custom gateway: `coffee-urgent-crab-303.mypinata.cloud`
- Automatic metadata pinning
- Image optimization and resizing
- Permanent storage with redundancy

### AI Configuration

Powered by Google Gemini with advanced features:

- Function calling for dynamic responses
- Vector similarity search
- Conversation memory management
- Rate limiting and usage optimization

### Linking Cross-Chain Assets

1. **Asset Management**: Go to the "Linked Assets" section
2. **Add New Asset**: Specify the chain, contract address, and token ID
3. **Verify Connection**: The system validates and links the asset
4. **Cross-Chain Portfolio**: View all your connected assets in one place

**🌟 Axon: Where Cross-Chain Identity Meets AI Innovation**

_Built for the ZetaChain ecosystem • Powered by cutting-edge AI • Secured by battle-tested infrastructure_
