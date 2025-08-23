# 🌟 Omni-Soul: Cross-Chain NFT Identity Platform

![Omni-Soul Banner](https://via.placeholder.com/1200x400/3b82f6/ffffff?text=Omni-Soul%20-%20Your%20Digital%20Soul%20on%20Chain)

Omni-Soul is a revolutionary NFT platform built on ZetaChain that creates digital representations of your identity with AI-powered personas and cross-chain asset linking capabilities.

## ✨ Features

- **🎨 Smart NFT Creation**: Mint unique Omni-Soul NFTs on ZetaChain
- **🧠 AI-Powered Personas**: Chat with AI that embodies your personal history
- **🔗 Cross-Chain Asset Linking**: Connect NFTs and assets from multiple blockchains
- **📦 Decentralized Storage**: IPFS integration via Pinata for permanent data storage
- **🌐 Modern Web3 Frontend**: Built with Next.js, TypeScript, and Tailwind CSS
- **⚡ ZetaChain Integration**: Leverage omnichain functionality for seamless operations

## 🏗️ Architecture

### Smart Contracts (`/contracts`)

- **OmniSoul.sol**: ERC-721 NFT contract with cross-chain asset linking
- Built with OpenZeppelin contracts for security and standards compliance
- Deployed on ZetaChain for omnichain capabilities

### Backend API (`/backend`)

- **Node.js + Express**: RESTful API server
- **ZetaChain Integration**: Smart contract interactions via ethers.js
- **IPFS Storage**: Pinata SDK for decentralized metadata storage
- **AI Persona Engine**: LangChain.js + Google Generative AI integration
- **Vector Storage**: In-memory vector stores for AI context retrieval

### Frontend (`/frontend`)

sbp_92da2ce3defa28533e08f7424a80264f5f5e651e

- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **wagmi + ConnectKit**: Web3 wallet integration
- **Framer Motion**: Smooth animations and interactions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- A ZetaChain testnet wallet with ZETA tokens
- Pinata account for IPFS storage
- Google AI API key for Gemini

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd OmniSoul

# Install dependencies for all components
npm run install:all
```

### 2. Environment Configuration

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# ZetaChain Configuration
PRIVATE_KEY=your_private_key_here
RPC_URL=https://rpc.ankr.com/zetachain_evm_testnet
CONTRACT_ADDRESS=  # Will be filled after deployment

# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Deploy Smart Contracts

```bash
cd contracts
npm install
npm run compile
npm run deploy:testnet
```

Copy the deployed contract address to your `.env` file.

### 4. Start the Backend

```bash
cd ../backend
npm install
npm run dev
```

The API server will start on `http://localhost:3001`

### 5. Start the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The web app will be available at `http://localhost:3000`

## 📱 Usage

### Creating an Omni-Soul NFT

1. **Connect Wallet**: Use the connect button to link your ZetaChain wallet
2. **Fill Personal Information**: Add your bio, education, work experience, memories
3. **Upload Media**: Add profile pictures or other media files
4. **Mint NFT**: Deploy your Omni-Soul to the blockchain
5. **AI Persona**: Your AI persona is automatically generated and ready for chat

### Chatting with AI Persona

1. **Navigate to Your Soul**: Go to your Omni-Soul's page
2. **Start Conversation**: Use the chat interface to ask questions
3. **Personal Responses**: The AI responds based on your personal history
4. **Context Awareness**: The AI remembers previous conversations

### Linking Cross-Chain Assets

1. **Asset Management**: Go to the "Linked Assets" section
2. **Add New Asset**: Specify the chain, contract address, and token ID
3. **Verify Connection**: The system validates and links the asset
4. **Cross-Chain Portfolio**: View all your connected assets in one place

## 🛠️ API Documentation

### NFT Endpoints

- `POST /api/omni-soul/create` - Create new Omni-Soul NFT
- `GET /api/omni-soul/:tokenId` - Get NFT metadata and information
- `POST /api/omni-soul/update-metadata` - Update NFT metadata
- `POST /api/omni-soul/link-asset` - Link cross-chain asset
- `GET /api/omni-soul/:tokenId/linked-assets` - Get linked assets

### AI Endpoints

- `POST /api/ai/chat` - Chat with AI persona
- `GET /api/ai/persona/:tokenId/status` - Get persona status
- `POST /api/ai/generate-summary` - Generate persona summary
- `POST /api/ai/persona/:tokenId/process` - Process persona data

## 🧪 Testing

### Smart Contracts

```bash
cd contracts
npm test
```

### Backend API

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

## 📋 Development Scripts

### Root Level Commands

```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev:all

# Build all components
npm run build:all

# Clean all builds
npm run clean:all
```

### Individual Component Commands

Each component (`contracts`, `backend`, `frontend`) has its own set of npm scripts. Refer to their respective `package.json` files for detailed commands.

## 🔧 Configuration

### ZetaChain Network Configuration

The project is configured for ZetaChain testnet by default. To use mainnet:

1. Update `RPC_URL` to `https://rpc.ankr.com/zetachain_evm`
2. Change `NEXT_PUBLIC_CHAIN_ID` to `7000`
3. Ensure you have mainnet ZETA tokens

### IPFS Configuration

Using Pinata for IPFS storage:

1. Create account at [pinata.cloud](https://pinata.cloud)
2. Generate API keys
3. Add keys to environment configuration

### AI Configuration

Using Google Generative AI (Gemini):

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add key to `GEMINI_API_KEY` environment variable

## 🚀 Deployment

### Production Environment

1. **Smart Contracts**: Deploy to ZetaChain mainnet
2. **Backend**: Deploy to cloud service (AWS, Vercel, etc.)
3. **Frontend**: Deploy to Vercel, Netlify, or similar platform

### Environment Variables

Ensure all production environment variables are set:

- Database connections (if added)
- API keys for external services
- Correct network configurations
- Security keys and secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Community**: Join our Discord for discussions and support

## 🙏 Acknowledgments

- **ZetaChain**: For the omnichain infrastructure
- **OpenZeppelin**: For secure smart contract libraries
- **Pinata**: For reliable IPFS storage
- **Google AI**: For advanced language model capabilities
- **The Community**: For feedback and contributions

---

Built with ❤️ for the ZetaChain Hackathon

_Omni-Soul - Where your digital identity comes alive_
