// 날짜 처리 함수
// 오류가 발생할 경우 null을 반환하므로 사용 시 관련 처리를 할 것

// Date 타입을 yyyy-mm-dd 형태로 변환 (쿼리에 삽입 가능한 형태)
export const dateToString = (date) => {
  try {
    let { year, month, day } = {
      year: date.getFullYear(),
      month: '' + (date.getMonth() + 1),
      day: '' + date.getDate(),
    };

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    const result = `${year}-${month}-${day}`;

    return result;
  } catch (e) {
    return null;
  }
};

// yyyy-mm-dd 형태의 텍스트를 Date 타입으로 변환
export const stringToDate = (string) => {
  try {
    const dateString = string.split('-');
    const date = new Date(dateString[0], dateString[1] - 1, dateString[2]);

    if (dateString.length !== 3) return null;

    return date;
  } catch (e) {
    return null;
  }
};
