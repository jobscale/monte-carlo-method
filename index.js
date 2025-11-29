import fs from 'fs';
import * as d3 from 'd3';
import { JSDOM } from 'jsdom';

const logger = console;

// HTMLを読み込んでDOMを作成
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

const main = () => {
  // parameter
  const EPOCH_NUM = 10000;
  const MANGNIFICATION = 2; // ゲームの倍率

  // const
  const INITIAL_BET_ARRAY = [20, 20, 20, 20, 20];

  // balance
  let BALANCE = 0;

  // result
  let gameNum = 0;
  let maxBet = 0;
  let minBalance = 0;
  const balanceRecordArray = [];

  // eslint-disable-next-line no-plusplus
  for (let game = 0; game < EPOCH_NUM; game++) {
    logger.info(`● ${game + 1}エポック目 スタート`);
    const betArray = [...INITIAL_BET_ARRAY];

    for (;;) {
      // eslint-disable-next-line no-plusplus
      gameNum++;
      const bet = betArray.length === 1 ? betArray[0] : betArray[0] + betArray[betArray.length - 1];
      if (bet > maxBet) {
        maxBet = bet;
      }
      BALANCE -= bet;

      // 勝負開始
      const gameResult = Math.floor(Math.random() * MANGNIFICATION);
      if (gameResult === 0) {
        // win
        BALANCE += bet * MANGNIFICATION;
        betArray.splice(0, 1);
        betArray.splice(betArray.length - 1, 1);
        logger.info(`◯ 勝ち +${bet * MANGNIFICATION} | 収支: ${BALANCE.toLocaleString()}`);
      } else {
        // lose
        if (BALANCE < minBalance) {
          minBalance = BALANCE;
        }
        betArray.push(bet);
        logger.info(`x 負け -${bet} | 収支: ${BALANCE.toLocaleString()}`);
      }

      // 記録
      balanceRecordArray.push(BALANCE);

      // エポック終了判定
      if (betArray.length === 0) {
        logger.info('----- エポック終了 -----');
        break;
      }
    }
  }

  logger.info('*************************************');
  logger.info(`- エポック数: ${EPOCH_NUM}`);
  logger.info(`- 合計ゲーム数: ${gameNum.toLocaleString()}`);
  logger.info(`- 最終収支: ${BALANCE.toLocaleString()}`);
  logger.info(`- 最低収支: ${minBalance.toLocaleString()}`);
  logger.info(`- 最大ベット: ${maxBet.toLocaleString()}`);
  logger.info('*************************************');

  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const svg = d3
  .create('svg')
  .attr('width', width)
  .attr('height', height);

  const xScale = d3
  .scaleLinear()
  .domain([0, balanceRecordArray.length])
  .range([margin.left, width - margin.right]);

  const yScale = d3
  .scaleLinear()
  .domain([d3.min(balanceRecordArray), d3.max(balanceRecordArray)])
  .range([height - margin.bottom, margin.top]);

  const line = d3
  .line()
  .x((d, i) => xScale(i))
  .y((d) => yScale(d));

  svg
  .append('path')
  .datum(balanceRecordArray)
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

  fs.writeFileSync('result.html', imageBuffer);

  return 0;
};

main();
