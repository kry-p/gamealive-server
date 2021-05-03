import Review from '../../models/review';
import { dateToString, stringToDate } from '../../modules/date';

const rejected = new RegExp('reject');
const cancelled = new RegExp('cancel');

const boolConverter = (string) => {
  try {
    if (string === 'true') return true;
    else return false;
  } catch (error) {
    return null;
  }
};

/*
    심의결과 조회 (날짜 기준, 페이지당 20개씩)
    GET /api/review/listbydate
*/
export const listbydate = async (ctx) => {
  const page = parseInt(ctx.query.page || '1', 10); // 입력값이 없을 경우 기본 페이지는 1
  const cancel = boolConverter(ctx.query.cancel);
  const reject = boolConverter(ctx.query.reject);
  let startDate = stringToDate(ctx.query.startdate);
  let endDate = stringToDate(ctx.query.enddate);

  // 둘 중 하나 이상 비어 있거나 시작일자가 종료일자를 역전하면 오류로 간주, 최근 일주일 표시
  if (startDate === null || endDate === null || startDate > endDate) {
    endDate = new Date();
    startDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);
  }

  // startDate 이상 endDate 이하
  const filter = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }; // prettier-ignore

  if (page < 1) {
    ctx.status = 400;
    return;
  }

  try {
    const notIn = [];

    if (!reject) notIn.push(rejected);
    if (!cancel) notIn.push(cancelled);

    const review = await Review.find(filter)
      .where('rating')
      .nin(notIn)
      .sort({ date: -1 }) // 날짜 역순
      .limit(10)
      .skip((page - 1) * 10)
      .exec();
    const reviewCount = await Review.countDocuments(filter)
      .where('rating')
      .nin(notIn)
      .exec();
    ctx.set('LastPage', Math.ceil(reviewCount / 10));
    ctx.set('CurrentPage', page);
    ctx.set('StartDate', dateToString(startDate));
    ctx.set('EndDate', dateToString(endDate));
    ctx.body = review;
  } catch (error) {
    ctx.throw(500, error);
  }
};

/*
    심의결과 조회 (텍스트 기준, 페이지당 20개씩)
    GET /api/review/listbykeyword
*/
export const listbykeyword = async (ctx) => {
  const page = parseInt(ctx.query.page || '1', 10); // 입력값이 없을 경우 기본 페이지는 1
  const cancel = boolConverter(ctx.query.cancel);
  const reject = boolConverter(ctx.query.reject);
  const keyword = ctx.query.keyword;
  const regex = new RegExp(keyword);

  // 특정 키워드만 검색
  const filter = {
    $or: [
      {
        "title": { $regex: regex, $options: 'i' },
      },
      {
        "applicant": { $regex: regex, $options: 'i' },
      },
    ],
  }; // prettier-ignore

  if (page < 1) {
    ctx.status = 400;
    return;
  }

  try {
    const notIn = [];

    if (!reject) notIn.push(rejected);
    if (!cancel) notIn.push(cancelled);

    const review = await Review.find(filter)
      .where('rating')
      .nin(notIn)
      .sort({ date: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .exec();
    const reviewCount = await Review.countDocuments(filter)
      .where('rating')
      .nin(notIn)
      .exec();
    ctx.set('CurrentPage', page);
    ctx.set('LastPage', Math.ceil(reviewCount / 10));
    ctx.set('Keyword', encodeURI(keyword));
    ctx.body = review;
  } catch (error) {
    ctx.throw(500, error);
  }
};
