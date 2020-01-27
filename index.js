global.logger = console;
JSON.clone = obj => JSON.parse(JSON.stringify(obj));
(() => {
  const { prototype } = Number;
  prototype.toMoney = function () { return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
})();
(() => {
  const { prototype } = Array;
  prototype.sum = function () { return this.reduce((a, b) => a + b); };
})();
const rate = 50;
const asset = {
  init: {
    list: [20, 20, 20, 20, 20],
    profit: 0,
    debt: 0,
    count: 0,
    currentBet: 0,
  },
  maxDebt: 0,
  maxBet: 0,
  totalProfit: 0,
  maxCount: 0,
  totalCount: 0,
};
class App {
  win(bet) {
    logger.info(` win : ${asset.profit.toMoney()} (bet ${bet.toMoney()})`);
    asset.profit += bet * 2;
    asset.list.pop();
    asset.list.shift();
  }
  loose(bet) {
    logger.info(`loose: ${asset.profit.toMoney()} (bet ${bet.toMoney()})`);
    asset.list.push(bet);
  }
  judge() {
    return Math.floor(Math.random() * 100) < rate;
  }
  fight(bet) {
    if (asset.maxBet < bet) asset.maxBet = bet;
    if (asset.currentBet < bet) asset.currentBet = bet;
    asset.profit -= bet;
    if (asset.debt > asset.profit) asset.debt = asset.profit;
    this[this.judge() ? 'win' : 'loose'](bet);
  }
  async initialize() {
    Object.assign(asset, JSON.clone(asset.init));
  }
  start() {
    while (asset.list.length) {
      asset.count++;
      const bet = asset.list.length < 2 ? asset.list[0] : asset.list[0] + asset.list[asset.list.length - 1];
      this.fight(bet);
    }
    if (asset.maxCount < asset.count) asset.maxCount = asset.count;
    if (asset.maxDebt > asset.debt) asset.maxDebt = asset.debt;
    asset.totalCount += asset.count;
    asset.totalProfit += asset.profit;
  }
  async main() {
    asset.init.list = asset.init.list.filter(v => v > 0);
    logger.info({
      list: asset.init.list,
      all: asset.init.list.sum(),
    });
    for (let i = 10000; i; i--) {
      await this.initialize()
      .then(() => this.start())
      .then(() => {
        const Current = {
          Profit: asset.profit.toMoney(),
          Debt: asset.debt.toMoney(),
          Bet: asset.currentBet.toMoney(),
          Count: asset.count,
        };
        logger.info(JSON.stringify({ Current }, null, 2));
      });
    }
    const Summery = {
      TotalProfit: asset.totalProfit.toMoney(),
      MaxDebt: asset.maxDebt.toMoney(),
      MaxBet: asset.maxBet.toMoney(),
      MaxCount: asset.maxCount,
      TotalCount: asset.totalCount.toMoney(),
    };
    logger.info(JSON.stringify({ Summery }, null, 2));
}
}
new App().main()
.catch(e => logger.error(e.message));
