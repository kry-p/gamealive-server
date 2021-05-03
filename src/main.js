import Koa from 'koa';
import Router from 'koa-router';
import mongoose from 'mongoose';
import cron from 'node-cron';
import logger from './modules/winston';
import serve from 'koa-static';
import path from 'path';
import send from 'koa-send';

import api from './api';
import getReviewData from './modules/review';

require('dotenv').config();

const app = new Koa();
const router = new Router();

const { PORT, MONGO_URI } = process.env;
const port = PORT || 4000;

const buildDirectory = path.resolve(__dirname, '../../front/build');

// 새로운 심의정보를 받아옴
async function handleAsync() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await getReviewData(today, today);
}

// connect to mongodb
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useFindAndModify: false })
  .then(() => {
    logger.info('Server: Connected to MongoDB');
  })
  .catch((e) => {
    logger.error(e);
  });

// 10분 주기로 실행
cron.schedule('*/10 * * * *', async () => {
  logger.info('Schedule: Crawler runs every 10 min.');
  await handleAsync();
});

router.use('/api', api.routes());

app.use(router.routes()).use(router.allowedMethods());

app.use(serve(buildDirectory));
app.use(async (ctx) => {
  // not found, not started at /api
  if (ctx.status === 404 && ctx.path.indexOf('/api') !== 0) {
    // return index.html
    await send(ctx, 'index.html', { root: buildDirectory });
  }
});

app.listen(port, () => {
  logger.info(`Server: Listening to port ${port}`);
});
