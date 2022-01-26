import Koa from 'koa';
import Router from 'koa-router';
import mongoose from 'mongoose';
import cron from 'node-cron';
import logger from './modules/winston';
import serve from 'koa-static';
import path from 'path';
import send from 'koa-send';

import cors from '@koa/cors';

import api from './api';
import getReviewData from './modules/review';
import compress from 'koa-compress';
import zlib from 'zlib';

require('dotenv').config();

const app = new Koa();
const router = new Router();

const { PORT, MONGO_URI, BUILD_DIR } = process.env;
const port = PORT || 4000;
const buildDirectory =
  BUILD_DIR === undefined ? undefined : path.resolve(__dirname, BUILD_DIR);

// get new review informations
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

// works every 10 min.
cron.schedule('*/10 * * * *', async () => {
  logger.info('Schedule: Scraper runs every 10 min.');
  await handleAsync();
});

router.use('/api', api.routes());

app.use(router.routes()).use(router.allowedMethods());
app.use(cors());
app.use(
  compress({
    threshold: 8192,
    flush: zlib.constants.Z_SYNC_FLUSH,
  }),
);

// for stand-alone API server
if (buildDirectory !== undefined) {
  app.use(serve(buildDirectory));
  app.use(async (ctx) => {
    // not found, not started at /api
    if (ctx.status === 404 && ctx.path.indexOf('/api') !== 0) {
      // return index.html
      await send(ctx, 'index.html', { root: buildDirectory });
    }
  });
}

app.listen(port, () => {
  logger.info(`Server: Listening to port ${port}`);
});
