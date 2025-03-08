const MultiWalletSwapBot = require('./MultiWalletSwapBot');

(async () => {
    const bot = new MultiWalletSwapBot();
    await bot.initialize();
    await bot.startSwaps();
})();
