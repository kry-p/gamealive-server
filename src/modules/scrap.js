import axios from 'axios';
import fastxml from 'fast-xml-parser';
import { cloneDeep } from 'lodash';

const xmlparser = new fastxml.XMLParser();
const rating = {
  all: '전체이용가',
  y12: '12세이용가',
  y15: '15세이용가',
  y18: '청소년이용불가',
  reject: '등급취소',
  cancel1: '등급거부예정',
  cancel2: '등급거부확정',
};

// 쿼리 스트링
const createQueryParams = (params) =>
  Object.keys(params)
    .map((td) => `${td}=${encodeURI(params[td])}`)
    .join('&');

async function scrap(startdate, enddate) {
  const category = ['M', 'P', 'V', 'A'];
  const period = [];
  const queries = [];
  const result = [];
  const query = {
    gametitle: '',
    entname: '',
    rateno: '',
    display: 500,
    pageno: 1,
  };
  let [currentyear, currentmonth] = [
    startdate.getFullYear(),
    startdate.getMonth() + 1,
  ];
  const [endyear, endmonth] = [enddate.getFullYear(), enddate.getMonth() + 1];

  while (currentyear <= endyear) {
    period.push(
      `${currentyear - 2000}${currentmonth.toString().padStart(2, '0')}`,
    );
    currentmonth += 1;

    if (currentyear == endyear && currentmonth >= endmonth) break;
    if (currentmonth > 12) {
      currentyear += 1;
      currentmonth = 1;
    }
  }

  category.forEach((c) => {
    period.forEach((p) => {
      query.rateno = `${c}-${p}`;
      queries.push(cloneDeep(query));
    });
  });

  // 페이지별 반복 작업
  await (async () => {
    for (const query of queries) {
      const uri = `${process.env.API_URI}${createQueryParams(query)}`;
      const res = await axios({
        url: uri,
        method: 'get',
      });

      await (async () => {
        if (res.status == 200) {
          const xml = res.data;
          const data = xmlparser.parse(xml).result;
          const mapper = {
            gametitle: 'title',
            orgname: '',
            entname: 'applicant',
            hoperate: '',
            givenrate: 'rating',
            rateno: 'code',
            rateddate: 'date',
          };
          if (!Array.isArray(data.item)) {
            data.item = [data.item];
          }
          if (data.tcount != 0) {
            for (let value of data.item) {
              for (let key in mapper) {
                if (mapper[key] === '') {
                  delete value[key];
                } else {
                  const temp = value[key];
                  delete value[key];
                  value[mapper[key]] = temp;

                  if (mapper[key] == 'rating') {
                    for (let r in rating) {
                      if (value.rating === rating[r]) value.rating = r;
                    }
                  }
                }
              }
            }
            data.item.forEach((item) => {
              result.push(item);
            });
          }
        }
      })();
    }
  })();
  return result;
}

// process
// 정상 수행될 경우 JSON 타입 데이터가 포함된 배열을 반환
// 결과물이 없거나 쿼리에 오류가 있을 경우 null을 반환
async function getData(start, end) {
  // 날짜가 잘못되면 종료
  if (start === null || end === null) return null;
  return await scrap(start, end);
}

export default getData;
