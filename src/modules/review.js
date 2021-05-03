import Review from '../models/review';
import getData from './scrap';
import logger from './winston';
import { dateToString, stringToDate } from '../modules/date';

const reviewMaker = (title, applicant, date, rating, code) => {
  return {
    updateOne: {
      "filter": { title: title, applicant: applicant }, // 게임물명과 신청자가 일치하는 정보가 있으면
      "update": { // 아래 내용을 변경함
        $set: {
          date: date,  // $가 없으면 타입캐스팅으로 인한 오류가 발생함
          rating: rating,
          code: code,
        },
      },
      "upsert": true,
    }, // prettier-ignore
  };
};

export default async function getReviewData(startDate, endDate) {
  // const currentDate = new Date(startDate.getTime());
  const result = {
    insertedCount: 0,
    matchedCount: 0,
    modifiedCount: 0,
    deletedCount: 0,
    upsertedCount: 0,
  };
  // const sleep = (ms) => {
  //   return new Promise((r) => setTimeout(r, ms));
  // };

  try {
    (async () => {
      const scrapResult = await getData(startDate, endDate);
      const bulkResult = [];

      if (scrapResult !== null) {
        // update 구문 구성
        scrapResult.forEach((review) => {
          bulkResult.push(
            reviewMaker(
              review.title,
              review.applicant,
              stringToDate(review.date),
              review.rating,
              review.code,
            ),
          );
        });
        // 일괄 삽입
        const bulkWriteResult = await Review.bulkWrite(bulkResult);

        result.insertedCount += bulkWriteResult.insertedCount;
        result.matchedCount += bulkWriteResult.matchedCount;
        result.modifiedCount += bulkWriteResult.modifiedCount;
        result.deletedCount += bulkWriteResult.deletedCount;
        result.upsertedCount += bulkWriteResult.upsertedCount;
      }

      logger.info(
        `Scraper: Collected review information from ${dateToString(
          startDate,
        )} to ${dateToString(endDate)}.
        Inserted: ${result.insertedCount}, Matched: ${
          result.matchedCount
        }, Modified: ${result.modifiedCount}, Deleted: ${
          result.deletedCount
        }, Upserted: ${result.upsertedCount}, 
        `,
      );
    })();
  } catch (error) {
    logger.error(`Scraper: Cannot get review information.\n
    Caused by: ${error}`);
  }
}
