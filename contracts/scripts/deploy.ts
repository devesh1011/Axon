const { ethers } = require("hardhat");

interface DeploymentInfo {
  network: string;
  contractAddress: string;
  deployerAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
}

async function main(): Promise<void> {
  console.log("Deploying OmniSoul contract to ZetaChain...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ZETA");

  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error(
      "Insufficient balance for deployment. Need at least 0.1 ZETA"
    );
  }

  // Deploy OmniSoul contract
  console.log("🚀 Starting contract deployment...");
  const OmniSoul = await ethers.getContractFactory("OmniSoul");

  // Deploy with explicit gas settings
  const omniSoul = await OmniSoul.deploy({
    gasLimit: 3000000,
    gasPrice: ethers.utils.parseUnits("20", "gwei"),
  });

  console.log("⏳ Deployment transaction sent. Waiting for confirmation...");
  console.log("🔗 Transaction hash:", omniSoul.deployTransaction.hash);

  await omniSoul.deployed();

  console.log("✅ OmniSoul contract deployed successfully!");
  console.log("📍 Contract address:", omniSoul.address);
  console.log("🔗 Transaction hash:", omniSoul.deployTransaction.hash);

  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await omniSoul.deployTransaction.wait(2);

  console.log("✅ Contract confirmed!");

  // Verify deployment by calling a view function
  try {
    const name = await omniSoul.name();
    const symbol = await omniSoul.symbol();
    const totalSupply = await omniSoul.totalSupply();

    console.log("📊 Contract details:");
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
    console.log("  Total Supply:", totalSupply.toString());
  } catch (error: any) {
    console.log("⚠️  Could not verify contract details:", error.message);
  }

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: "zetachain_testnet",
    contractAddress: omniSoul.address,
    deployerAddress: deployer.address,
    transactionHash: omniSoul.deployTransaction.hash,
    blockNumber: omniSoul.deployTransaction.blockNumber || 0,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💡 Next steps:");
  console.log("1. Update your .env file with the contract address:");
  console.log(`   CONTRACT_ADDRESS=${omniSoul.address}`);
  console.log("2. Start the backend server");
  console.log("3. Test the contract interaction");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
