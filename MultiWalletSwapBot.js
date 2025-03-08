require('dotenv').config();
console.log('🔍 Loaded Private Key from .env:', process.env.WALLET_PRIVATE_KEY);

const WalletManager = require('./WalletManager');
const ZeroGSwapBot = require('./ZeroGSwapBot');

class MultiWalletSwapBot {
    constructor() {
        this.walletManager = new WalletManager();
        this.swapBots = [];
    }

    async initialize() {
        console.log('Initializing MultiWalletSwapBot...');
        await this.walletManager.loadExistingWallets();
        console.log('Wallets loaded:', this.walletManager.wallets);
    }

    async startSwaps() {
        if (this.walletManager.wallets.length === 0) {
            console.log('⚠️ No wallets found');
            return;
        }

        for (const wallet of this.walletManager.wallets) {
            console.log(`🔹 Initializing swap bot for: ${wallet.address}`);
            const swapBot = new ZeroGSwapBot();
            await swapBot.initializeWithPrivateKey(wallet.privateKey);
            this.swapBots.push(swapBot);
        }

        console.log(`Starting swaps for ${this.swapBots.length} wallets...`);
        
        for (const swapBot of this.swapBots) {
            swapBot.startRandomSwaps(5, 10);
        }
    }
}

module.exports = MultiWalletSwapBot;
