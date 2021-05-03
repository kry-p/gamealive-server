// 확인 결과 URL + 쿼리만으로 원하는 페이지를 띄울 수 있음
import webdriver, { By, until } from 'selenium-webdriver';
import { dateToString } from './date';
import chrome from 'selenium-webdriver/chrome';
import logger from './winston';

const options = new chrome.Options();

options.addArguments('--headless');
options.addArguments('--disable-gpu');

const driver = new webdriver.Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .build();

const baseUrl = 'https://www.grac.or.kr/Statistics/GameStatistics.aspx?';
const params = {
  organizationcd: '', // 등급분류기관
  entname: '', // 신청자
  omflag: '', // 구분
  width: '', // 웹 브라우저 폭
  startdate: '', // 등급분류일자 시작
  enddate: '', // 등급분류일자 끝
  gametitle: '', // 게임명
  type: 'search', // 쿼리 타입
  pageindex: 0, // 목록 내 페이지
  ratingnbr: '', // 등급분류번호
  givenrate: '00',
  // 등급 00: 전체, 01: 전체이용가 02: 청소년이용불가 03: 15세이용가 04: 12세이용가
  // 05: 등급거부예정 06: 등급거부확정 07: 등급취소예정 09: 등급취소
};

const rating = {
  all: 'https://www.grac.or.kr/Images/grade_icon/rating_all.gif',
  y12: 'https://www.grac.or.kr/Images/grade_icon/rating_12.gif',
  y15: 'https://www.grac.or.kr/Images/grade_icon/rating_15.gif',
  y18: 'https://www.grac.or.kr/Images/grade_icon/rating_18.gif',
  reject: 'https://www.grac.or.kr/Images/grade_icon/icon_reject.gif',
  cancel1: 'https://www.grac.or.kr/Images/grade_icon/icon_cancel1.gif',
  cancel2: 'https://www.grac.or.kr/Images/grade_icon/icon_cancel2.gif',
};

// 쿼리 스트링
const createQueryParams = (params) =>
  Object.keys(params)
    .map((td) => `${td}=${encodeURI(params[td])}`)
    .join('&');

// 찾는 날짜의 심의목록 총 페이지 수
async function getPageCount(url) {
  await driver.get(url);

  try {
    const pageElement = await driver.findElement(
      By.xpath(`//*[@id="container"]/div/div[2]/div[3]/p/em[2]`),
    );

    const text = await pageElement.getText();
    const pages = text.split('/')[1]; // 전체 페이지 수

    return pages;
  } catch (e) {
    return null;
  }
}

// 크롤링
async function crawl(pages) {
  // 시간제한 (반복문 강제 딜레이)
  const timer = (ms) => new Promise((res) => setTimeout(res, ms));
  // 크롤링 결과
  const result = [];

  // 결과에 삽입하는 방법
  const pushIntoResult = (game, column, txt) => {
    switch (column) {
      case 1:
        game.title = txt;
        break;
      case 2:
        game.applicant = txt;
        break;
      case 3:
        game.date = txt;
        break;
      case 4:
        for (let key in rating) {
          if (txt === rating[key]) game.rating = key;
        }
        break;
      case 5:
        game.code = txt;
        break;
      default:
        break;
    }
  };

  // 입력받은 페이지 크롤링
  const crawler = async (page) => {
    params.pageindex = page; // 쿼리문에 페이지를 지정

    await driver.get(baseUrl + createQueryParams(params)); // 페이지를 가져옴
    await driver.wait(
      until.elementLocated(
        By.xpath('//*[@id="ctl00_ContentHolder_rptGradeDoc_ctl00_trClass"]'),
      ),
      15000,
    ); // 찾는 엘리먼트가 로드될 때까지 대기

    // 등급분류 취소된 게임물이 있는지 확인
    await driver
      .findElement(
        By.xpath('//*[@id="container"]/div/div[2]/div[3]/table[2]/tbody/tr/td'),
      )
      .then((element) => {
        let pos = null; // 웹 페이지에서 찾는 테이블의 위치
        element.getText().then((txt) => {
          txt === '등급분류 결정 취소 게임물은 관보게재일로부터 효력 발생'
            ? (pos = 3) // 취소된 게임물이 있을 때의 테이블 위치
            : (pos = 2); // 없을 때의 테이블 위치

          (async () => {
            await driver
              .findElements(
                By.xpath(
                  `//*[@id="container"]/div/div[2]/div[3]/table[${pos}]/tbody/tr`,
                ), // 심의목록 표 찾기
              )
              .then((elements) => {
                // 각 페이지의 테이블에 있는 요소만큼 검색
                for (let tr = 0; tr < elements.length; tr++) {
                  const game = {
                    title: null,
                    applicant: null,
                    date: null,
                    rating: null,
                    code: null,
                  };

                  for (let td = 1; td <= 5; td++) {
                    if (td == 4) {
                      driver
                        .findElement(
                          By.xpath(
                            `//*[@id="ctl00_ContentHolder_rptGradeDoc_ctl0${tr}_trClass"]/td[${td}]/img`,
                          ),
                        )
                        .then((element) => {
                          element
                            .getAttribute('src')
                            .then((src) => pushIntoResult(game, td, src));
                        })
                        .catch(() => {
                          pushIntoResult(td, null); // 오류 발생 시 null 삽입
                          logger.error(
                            'Crawler: No corresponding image element found.',
                          );
                        });
                    } else {
                      driver
                        .findElement(
                          By.xpath(
                            `//*[@id="ctl00_ContentHolder_rptGradeDoc_ctl0${tr}_trClass"]/td[${td}]`,
                          ),
                        )
                        .then((element) =>
                          element
                            .getText()
                            .then((txt) => {
                              pushIntoResult(game, td, txt);
                            })
                            .catch(() => {
                              pushIntoResult(td, null);
                            }),
                        )
                        .catch(() => {
                          pushIntoResult(game, td, null); // 오류 발생 시 null 삽입
                        });
                    }
                  }
                  result.push(game);
                }
              })
              .catch(() => {
                logger.error('Crawler: No corresponding table element found.');
              });
          })();
        });
      });
  };

  // 페이지별 반복 작업
  await (async () => {
    for (let i = 0; i < pages; i++) {
      await crawler(i);
      await timer(1000);
    }
  })();

  return result;
}

// process
// 정상 수행될 경우 JSON 타입 데이터가 포함된 배열을 반환
// 결과물이 없거나 쿼리에 오류가 있을 경우 null을 반환
async function getData(startdate, enddate) {
  params.startdate = dateToString(startdate);
  params.enddate = dateToString(enddate);

  // 날짜가 잘못되면 종료
  if (params.startdate === null || params.enddate === null) return null;

  const url = baseUrl + createQueryParams(params);
  const pages = await getPageCount(url);

  if (pages !== null) {
    return await crawl(pages);
  } else return null;
}

export default getData;
