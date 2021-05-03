# gamealive-server

<p>
  <image src="https://img.shields.io/badge/using-Koa.js-%2362d5d3?style=flat-square&logo=node.js"/>&nbsp
  <image src="https://img.shields.io/badge/using-Selenium-%2343B02A?style=flat-square&logo=selenium"/>&nbsp 
</p>

게임물관리위원회의 실시간 심의정보를 제공하는 웹 사이트 gamealive의 API 서버입니다.

## 실행 전 요구사항

아래 라이브러리 및 프로그램은 수동 설치를 필요로 합니다.

+ npm
+ google-chrome
+ chromedriver

또, 오프라인 설치 시에는 ```Yarn```이 필요하므로 [링크](https://github.com/yarnpkg/yarn/release)에서 미리 다운로드해 주시기 바랍니다. 모든 작업은 Yarn 사용이 권장됩니다.

## 실행 방법

함께 제공되는 [클라이언트](https://github.com/kry-p/gamealive-client)를 이용할 경우 소스를 다운로드 후 직접 빌드하거나, Release 빌드를 다운로드해 로컬에 저장합니다.  
다운로드 후 서버 루트 디렉터리에 ```.env``` 파일을 생성한 뒤 환경 변수를 작성합니다.

필요한 환경 변수는 아래와 같습니다. ⭐️ 표시는 필수입니다.  
+ PORT  
서비스를 제공할 포트 번호입니다. 비어 있을 경우 4000을 기본으로 사용합니다.

+ MONGO_URI ⭐️  
접속할 MongoDB의 URI입니다.

+ BUILD_DIR  
API를 사용할 클라이언트의 빌드 디렉터리입니다.

아래는 예시입니다.
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/review
BUILD_DIR=../../gamealive-client/build
```
작성 후 서버 루트 디렉터리에서 아래 명령 중 하나를 실행합니다.  
```yarn install```  
```npm install```

오프라인 설치 시에는 Release 빌드를 다운로드 후 아래 명령을 실행합니다.  
```yarn install --offline```

Yarn이 설치되어 있지 않을 경우 [링크](https://github.com/yarnpkg/yarn/release)에서 다운로드한 파일로 아래 명령을 실행합니다.  
```node (yarn 모듈 위치) install --offline```


위 작업이 완료되면  ```yarn start``` 또는 ```npm run start``` 으로 서버를 가동합니다.

## 기능 목록

지원하는 API는 아래와 같습니다.

+ /api/review/listbydate  
입력한 날짜에 해당하는 심의 정보를 데이터베이스에 저장된 정보에 한해 가져옵니다.
아래 쿼리를 지원합니다.
  + startdate  
  시작 날짜입니다. yyyy-mm-dd 형식으로 입력합니다. 값이 없거나 잘못된 값일 시 최근 일주일을 입력한 것으로 간주됩니다.
  + enddate  
  종료 날짜입니다. yyyy-mm-dd 형식으로 입력합니다. 값이 없거나 잘못된 값일 시 최근 일주일을 입력한 것으로 간주됩니다.
  + page  
  페이지네이션입니다(10개당 1페이지). 값이 없을 시 1페이지로 간주됩니다.
  + reject  
  심의거부된 게임물 표시 여부 옵션입니다. true 또는 false를 입력하며, 값이 없을 시 false로 간주됩니다.
  + cancel 심의거부된 게임물 표시  
  심의취소된 게임물 표시 여부 옵션입니다. true 또는 false를 입력하며, 값이 없을 시 false로 간주됩니다.

+ /api/review/listbykeyword  
입력한 키워드에 해당하는 심의 정보를 데이터베이스에 저장된 정보에 한해 가져옵니다.
아래 쿼리를 지원합니다.
  + keyword  
  키워드입니다. 값이 없을 시 전부 가져오며, 영문 대소문을 구분하지 않습니다.
  + page  
  페이지네이션입니다(10개당 1페이지). 값이 없을 시 1페이지로 간주됩니다.
  + reject  
  심의거부된 게임물 표시 여부 옵션입니다. true 또는 false를 입력하며, 값이 없을 시 false로 간주됩니다.
  + cancel 심의거부된 게임물 표시  
  심의취소된 게임물 표시 여부 옵션입니다. true 또는 false를 입력하며, 값이 없을 시 false로 간주됩니다.


## 부가 기능

과거 심의정보를 일괄로 가져올 수 있습니다.  
서버 루트 디렉터리에서 ```yarn start:batch``` 나  ```npm run start:batch```를 입력한 뒤 init 모듈을 선택, 지시를 따릅니다.

## 🚧 구현 예정인 기능 🚧

+ 자율심의 게임물 정보
+ 커뮤니티

## FAQ & Known problems

아직 내용이 없습니다. 궁금한 점이나 문제가 있다면 Issue 란에 질문해 주세요.
