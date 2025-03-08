const ethers = require('ethers');
const { CONFIG, ROUTER_ABI, ERC20_ABI } = require('./config');

class ZeroGSwapBot {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.router = null;
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
        this.currentRpcIndex = 0;
        this.maxGasRetries = 5;
        this.gasIncreaseFactor = 1.2; // 20% increase each retry
    }

    async tryConnectRPC() {
        for (let i = 0; i < CONFIG.RPC_URLS.length; i++) {
            const rpcUrl = CONFIG.RPC_URLS[i];
            try {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                await provider.getNetwork(); // Test the connection
                console.log(`✅ Connected to RPC: ${rpcUrl}`);
                this.provider = provider;
                return provider;
            } catch (error) {
                console.log(`⚠️ Failed to connect to RPC ${rpcUrl}: ${error.message}`);
            }
        }
        throw new Error('All RPC endpoints failed');
    }

    async initializeWithPrivateKey(privateKey) {
        if (!privateKey || privateKey === 'your_private_key_here') {
            throw new Error('Invalid private key');
        }
        
        const provider = await this.tryConnectRPC();
        this.wallet = new ethers.Wallet(privateKey, provider);
        this.router = new ethers.Contract(CONFIG.UNISWAP.ROUTER, ROUTER_ABI, this.wallet);
        
        console.log(`Initialized with wallet: ${this.wallet.address}`);
    }

    async performSwap(pair, amount) {
        try {
            const params = {
                tokenIn: pair.token0.address,
                tokenOut: pair.token1.address,
                fee: pair.fee,
                recipient: this.wallet.address,
                deadline: Math.floor(Date.now() / 1000) + 60 * 20,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            };

            const gasLimit = CONFIG.GAS_SETTINGS.CUSTOM_GAS_LIMIT || CONFIG.GAS_SETTINGS.DEFAULT_GAS_LIMIT;
            const tx = await this.router.exactInputSingle(params, {
                gasPrice: ethers.utils.parseUnits('20', 'gwei'),
                gasLimit: gasLimit
            });

            console.log(`🔄 Swap transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log('✅ Swap completed');
        } catch (error) {
            console.error('Error performing swap:', error.message);
            throw error;
        }
    }

    async startRandomSwaps(txCount, delayInSeconds) {
        for (let i = 0; i < txCount; i++) {
            console.log(`📊 Starting swap ${i + 1}/${txCount}`);
            const pair = CONFIG.AVAILABLE_PAIRS[Math.floor(Math.random() * CONFIG.AVAILABLE_PAIRS.length)];
            const amount = ethers.utils.parseEther((0.01 + Math.random() * 0.09).toFixed(6));
            await this.performSwap(pair, amount);
            
            if (i < txCount - 1) {
                const delay = typeof delayInSeconds === 'string' ? Math.floor(Math.random() * 3600) : delayInSeconds;
                console.log(`⏳ Waiting ${delay} seconds before next swap...`);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }
    }
}

module.exports = ZeroGSwapBot;
