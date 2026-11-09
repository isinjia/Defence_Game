# 캐릭터 일러스트 넣는 법

이 폴더에 그림 파일을 넣고 `portraits.js` 에 등록하면 게임이 코드로 그린 초상화 대신 그 그림을 씁니다.
플레이어와 모든 NPC가 성별에 맞는 그림 중 하나를 고정으로 배정받습니다. 그림이 많을수록 인물이 겹치지 않습니다.

## 규격

- 비율 5:6 세로형 상반신, 권장 크기 500×600
- 얼굴이 위쪽 1/3 지점에 오게. 원형 아이콘은 그림 위쪽 가운데를 잘라 씁니다.
- 형식 `.webp` 권장 (`.png`, `.jpg` 도 가능). 한 장 150KB 이하로 줄이면 핸드폰에서도 빠릅니다.
- 파일 이름 예: `m01.webp`, `f01.webp`

## 등록

```js
const PORTRAIT_IMAGES = [
  { file: 'm01.webp', gender: 'M' },
  { file: 'f01.webp', gender: 'F' },
];
```

남녀 각각 최소 8장, 가능하면 20장 이상을 권장합니다.

## 생성 프롬프트

한국 현대판타지 헌터물 웹소설 표지 화풍을 기준으로 합니다. 이미지 생성 도구에 아래 공통 문구와 인물별 문구를 이어 붙여 쓰면 됩니다.

공통 문구:

```
korean webtoon style, modern fantasy hunter web novel cover art, semi-realistic anime, sharp handsome face, detailed digital painting, cinematic rim lighting, glowing mana particles, dramatic dark background, upper body portrait, looking at viewer, high detail, 5:6 aspect ratio
```

인물별 예시:

```
young korean man, messy black hair with bangs over eyes, black leather jacket over black turtleneck, cyan lightning aura, slight smirk
young korean man, ash blond hair, white shirt under black coat, calm half-lidded eyes, golden light
young korean woman, long straight black hair, tactical bodysuit with red accents, fiery orange aura, confident look
young korean woman, silver bob hair, modern hanbok-style collar jacket, icy blue aura, cold expression
middle-aged korean man, short hair, scar across eyebrow, heavy armor plate, steel gray aura
```

속성별 오라 색: 염 orange red, 뇌 yellow lightning, 빙 icy blue, 강 steel silver, 영 violet purple.

## 주의

- 실제 웹소설·웹툰 표지 이미지를 그대로 쓰면 저작권 침해입니다. 직접 생성했거나 사용 허락을 받은 그림만 넣으세요.
- 생성 도구의 상업적 이용 약관도 확인하세요.
