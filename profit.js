import fs from 'fs';
import { JSDOM } from 'jsdom';
import * as d3 from 'd3';

const logger = console;

JSON.clone = obj => JSON.parse(JSON.stringify(obj));
(() => {
  const { prototype } = Number;
  prototype.toMoney = function toMoney() {
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
})();

(() => {
  const { prototype } = Array;
  prototype.sum = function sum() {
    return this.reduce((a, b) => a + b);
  };
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
  transitionProfit: [],
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
      // eslint-disable-next-line no-plusplus
      asset.count++;
      const bet = asset.list.length < 2
        ? asset.list[0]
        : asset.list[0] + asset.list[asset.list.length - 1];
      this.fight(bet);
      asset.transitionProfit.push(asset.totalProfit + asset.profit);
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
    // eslint-disable-next-line no-plusplus
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

    // Generate SVG Plot
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const { document } = dom.window;

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };

    const svg = d3
    .select(document.body)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

    const xScale = d3
    .scaleLinear()
    .domain([0, asset.transitionProfit.length - 1])
    .range([margin.left, width - margin.right]);

    const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(asset.transitionProfit),
      d3.max(asset.transitionProfit),
    ])
    .range([height - margin.bottom, margin.top]);

    const line = d3
    .line()
    .x((d, i) => xScale(i))
    .y(d => yScale(d));

    svg
    .append('path')
    .datum(asset.transitionProfit)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .attr('d', line);

    svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

    svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

    const svgString = svg.node().outerHTML;
    const imageBuffer = Buffer.from(svgString);
    fs.writeFileSync('profit.html', imageBuffer);

    return 0;
  }
}

new App().main()
.catch(e => logger.error(e.message));
