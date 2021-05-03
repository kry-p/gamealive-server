/*
 * 초기 심의정보 구축을 위한 일괄 처리 모듈
 */

import mongoose from 'mongoose';
import logger from '../modules/winston';
import { dateToString } from '../modules/date';

import getReviewData from '../modules/review';

require('dotenv').config();

const { MONGO_URI } = process.env;

export default async function batch(startDate, endDate) {
  // connect to mongodb

  logger.info('Crawler: Batch crawling process begins...');
  logger.info(
    `Crawler: Starts at ${dateToString(startDate)}, ends at ${dateToString(
      endDate,
    )}`,
  );

  await mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useFindAndModify: false })
    .then(() => {
      logger.info('Server: Connected to MongoDB');
    })
    .catch((e) => {
      logger.error(e);
    });

  await getReviewData(startDate, endDate);
}
