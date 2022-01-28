/*
 * Koa.js - Node API server with TLS
 * for gamealive
 *
 * https://github.com/kry-p/gamealive-server
 */

// Built-in module
import fs from 'fs';
import http from 'http';
import https from 'https';
import cron from 'node-cron';
import path from 'path';
import compress from 'koa-compress';

// Koa.js
import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import serve from 'koa-static';
import send from 'koa-send';
import forceHTTPS from 'koa-force-https';

// database
import mongoose from 'mongoose';

// utility
import zlib from 'zlib';

// misc.
import logger from './modules/winston';
import api from './api';
import getReviewData from './modules/review';

require('dotenv').config();

const app = new Koa();
const router = new Router();

const { PORT, MONGO_URI, BUILD_DIR, CERT_PATH } = process.env;
const port = PORT || 4000;
const buildDirectory =
  BUILD_DIR === undefined ? undefined : path.resolve(__dirname, BUILD_DIR);

const serverCallback = app.callback();

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

try {
  router.use('/api', api.routes());

  app.use(router.routes()).use(router.allowedMethods());
  app.use(cors());
  app.use(
    compress({
      threshold: 8192,
      flush: zlib.constants.Z_SYNC_FLUSH,
    }),
  );
  app.use(forceHTTPS());

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

  // for https callback
  if (CERT_PATH !== undefined) {
    const config = {
      domain: 'gamealive.xyz',
      https: {
        port: 443,
        options: {
          key: fs
            .readFileSync(path.resolve(CERT_PATH, 'privkey.pem'), 'utf-8')
            .toString(),
          cert: fs
            .readFileSync(path.resolve(CERT_PATH, 'fullchain.pem'), 'utf-8')
            .toString(),
        },
      },
    };

    http.createServer(app.callback()).listen(80);
    const httpsServer = https.createServer(
      config.https.options,
      serverCallback,
    );

    httpsServer.listen(config.https.port, function (err) {
      if (err) {
        logger.error('Server: https server cannot be established.');
      } else {
        logger.info(
          `Server: Established - https://${config.domain}:${config.https.port}`,
        );
      }
    });
  }

  app.listen(port, () => {
    logger.info(`Server: Listening to port ${port}`);
  });
} catch (e) {
  logger.error('Server: Establishing instance failed.');
}
