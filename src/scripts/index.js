/*
 * 일괄 처리 스크립트 관리 모듈
 */

import { stringToDate } from '../modules/date';
import batch from './batch_crawl';
import readlineSync from 'readline-sync';
import logger from '../modules/winston';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const batchReview = (startDate, endDate) => {
  const dateValue = {
    start: typeof startDate === 'object' ? startDate : stringToDate(startDate),
    end: typeof endDate === 'object' ? endDate : stringToDate(endDate),
  };

  if (
    dateValue.start > dateValue.end ||
    dateValue.start === null ||
    dateValue.end === null
  ) {
    console.log('E: Invalid format');
  } else if (dateValue.start > today || dateValue.end > today) {
    console.log('E: Future review information cannot be crawled.');
  } else {
    batch(dateValue.start, dateValue.end);
  }
};

const modules = {
  init: {
    name: 'Review initialization module',
    exec: () => {
      const startDate = readlineSync.question('Enter the start date : ');

      batchReview(startDate, today);
    },
  },
};

// executable
(() => {
  logger.info('Batch: init');
  console.log('Batch operation program');
  console.log('-------- Modules list --------');

  Object.keys(modules).map((key) => {
    console.log(`${key}: ${modules[key].name}`);
  });

  const input = readlineSync.question(
    "\nPlease enter a module name to run (type 'exit' to close) : ",
  );
  if (input in modules) {
    (async () => {
      logger.info(`Batch: ${modules[input].name} started.\n`);
      await modules[input].exec();
    })();
  } else {
    if (input === 'exit') process.exit();

    logger.error(
      `Batch: No corresponding batch module found. module: ${input}`,
    );
    process.exit();
  }
})();
