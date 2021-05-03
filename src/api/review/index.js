import Router from 'koa-router';
import * as reviewCtrl from './review.ctrl';

const review = new Router();

review.get('/listbydate', reviewCtrl.listbydate);
review.get('/listbykeyword', reviewCtrl.listbykeyword);

export default review;
