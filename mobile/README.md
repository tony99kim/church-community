# ChurchHub 안드로이드 앱

배포된 웹사이트(https://church-community-zeta.vercel.app)를 앱 화면 안에서 그대로 띄우는 안드로이드 앱입니다 (Capacitor).
웹과 같은 서버·DB를 쓰기 때문에 데이터와 로그인이 웹과 똑같고, 웹사이트를 고치면 앱을 다시 만들지 않아도 바로 반영됩니다.

## 준비물
- Node.js
- Android Studio (Android SDK 포함)

## 처음 한 번 / 저장소를 새로 받은 뒤
```bash
cd mobile
npm install
npx cap sync android
npx cap open android      # Android Studio가 android 폴더를 엽니다
```
Android Studio에서 처음 열면 Gradle 동기화가 끝날 때까지 기다립니다.

## 내 폰에 설치하기
- **USB로 바로 설치**: 폰의 개발자 옵션 → USB 디버깅을 켜고 PC에 연결한 뒤, Android Studio 상단에서 폰을 고르고 ▶(Run)를 누릅니다.
- **APK 파일로 설치**: Android Studio 메뉴 Build → Build App Bundle(s) / APK(s) → Build APK(s).
  만들어진 파일은 `android/app/build/outputs/apk/debug/app-debug.apk` 입니다.
  이 파일을 폰으로 보내 열면 설치되며, 처음에는 "출처를 알 수 없는 앱 설치"를 허용해야 합니다.

## 설정을 바꿀 때
- 앱이 여는 주소, 앱 이름, 패키지명: `capacitor.config.json`
- 바꾼 뒤에는 `npx cap sync android`를 다시 실행합니다.
- 아이콘: Android Studio에서 `app/src/main/res` 우클릭 → New → Image Asset.

## 참고
- 휴대폰 뒤로가기 버튼은 웹 페이지 뒤로가기로 동작하고, 첫 화면에서 누르면 앱이 닫힙니다 (`@capacitor/app`).
- Play 스토어에 올리려면 Build → Generate Signed App Bundle로 서명된 AAB를 만들어야 합니다. 서명 키(.jks)는 저장소에 넣지 마세요.
