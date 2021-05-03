import Router from 'koa-router';
import review from './review';

const api = new Router();

api.use('/review', review.routes());

// export router
export default api;
