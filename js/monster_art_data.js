// 종별 원화 연결 정보. 표시 파일을 다시 만들 때 함께 갱신한다.
const MONSTER_ART_DATA = {
  "가시털 들개": {
    "elem": "wood",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "b18c2af270"
  },
  "산성 슬라임": {
    "elem": "water",
    "shape": "slime",
    "tier": 0,
    "special": false,
    "rev": "bbcffc460a"
  },
  "전기 날벌레떼": {
    "elem": "bolt",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "d05d11d3bd"
  },
  "빛무리 드론": {
    "elem": "holy",
    "shape": "drone",
    "tier": 1,
    "special": false,
    "rev": "2725c60d54"
  },
  "불꽃 쥐": {
    "elem": "fire",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "0e98219ac2"
  },
  "이끼 골렘": {
    "elem": "wood",
    "shape": "golem",
    "tier": 2,
    "special": false,
    "rev": "8302a659a0"
  },
  "서리 늑대": {
    "elem": "water",
    "shape": "beast",
    "tier": 2,
    "special": false,
    "rev": "336c65b631"
  },
  "뇌격 비행체": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 3,
    "special": false,
    "rev": "3c2552fb42"
  },
  "망자의 합창단": {
    "elem": "dark",
    "shape": "choir",
    "tier": 3,
    "special": false,
    "rev": "1846c2299e"
  },
  "용암 두꺼비": {
    "elem": "fire",
    "shape": "slime",
    "tier": 3,
    "special": false,
    "rev": "7da4d78dd4"
  },
  "가시 거미 여왕": {
    "elem": "wood",
    "shape": "spider",
    "tier": 4,
    "special": false,
    "rev": "7b2c61a9d6"
  },
  "빙설 세이렌": {
    "elem": "water",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "a2b63014db"
  },
  "천둥 기수": {
    "elem": "bolt",
    "shape": "flyer",
    "tier": 5,
    "special": false,
    "rev": "f7caed0317"
  },
  "심판의 눈": {
    "elem": "holy",
    "shape": "eye",
    "tier": 5,
    "special": false,
    "rev": "951fc6b0d9"
  },
  "적룡 파편체": {
    "elem": "fire",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "e7c5831793"
  },
  "폭풍 와이번": {
    "elem": "bolt",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "ba1ec26b66"
  },
  "고목 거신": {
    "elem": "wood",
    "shape": "golem",
    "tier": 6,
    "special": false,
    "rev": "685cff21c0"
  },
  "빙결 고룡": {
    "elem": "water",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "3b6d74ead7"
  },
  "심연 감시자": {
    "elem": "dark",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "b08b83924b"
  },
  "태양의 잔해": {
    "elem": "fire",
    "shape": "core",
    "tier": 7,
    "special": false,
    "rev": "dc89097a3f"
  },
  "하수구 고블린": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 0,
    "special": false,
    "rev": "7e0336f489"
  },
  "잿불 임프": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 0,
    "special": false,
    "rev": "c1e669c961"
  },
  "성광 반딧불": {
    "elem": "holy",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "7650d5c5b0"
  },
  "녹슨 경비 로봇": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 1,
    "special": false,
    "rev": "9abeedd1b3"
  },
  "독안개 버섯": {
    "elem": "wood",
    "shape": "slime",
    "tier": 1,
    "special": false,
    "rev": "be42a949cb"
  },
  "침수 해파리": {
    "elem": "water",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "f313973068"
  },
  "오크 약탈자": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 2,
    "special": false,
    "rev": "7a0dc4b66d"
  },
  "리자드맨 창병": {
    "elem": "water",
    "shape": "humanoid",
    "tier": 2,
    "special": false,
    "rev": "51fefe62a0"
  },
  "하피": {
    "elem": "bolt",
    "shape": "flyer",
    "tier": 2,
    "special": false,
    "rev": "431d22cfb2"
  },
  "병동의 그림자": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "9e32296e3c"
  },
  "미믹": {
    "elem": "dark",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "b8df829c57"
  },
  "가고일": {
    "elem": "holy",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "c887b95fde"
  },
  "엘리베이터 괴담": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "1e2b3fb0f0"
  },
  "언데드 기사": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 4,
    "special": false,
    "rev": "5f88bf009a"
  },
  "키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "6530379d0e"
  },
  "오크 주술사": {
    "elem": "wood",
    "shape": "humanoid",
    "tier": 4,
    "special": false,
    "rev": "e087863a2f"
  },
  "성역 수호상": {
    "elem": "holy",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "5fa70c7908"
  },
  "서버 망령": {
    "elem": "bolt",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "55e9c981cb"
  },
  "막차 괴담": {
    "elem": "bolt",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "f8334ea45b"
  },
  "심해 촉수": {
    "elem": "water",
    "shape": "spider",
    "tier": 5,
    "special": false,
    "rev": "effb41ee8d"
  },
  "오크 대족장": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 6,
    "special": false,
    "rev": "dd999d3094"
  },
  "타락 천사": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 6,
    "special": false,
    "rev": "a6fed0ee4f"
  },
  "공허 키메라": {
    "elem": "dark",
    "shape": "beast",
    "tier": 6,
    "special": false,
    "rev": "0ffb5029b7"
  },
  "세계수 뿌리": {
    "elem": "wood",
    "shape": "spider",
    "tier": 7,
    "special": false,
    "rev": "617d725dc5"
  },
  "강철 메카 거병": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 7,
    "special": false,
    "rev": "b13b04f1b8"
  },
  "광휘의 성자": {
    "elem": "holy",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "ca759c6dca"
  },
  "황금 코어 도마뱀": {
    "elem": "holy",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "049d508d0b"
  },
  "심연의 군주": {
    "elem": "dark",
    "shape": "lord",
    "tier": 7,
    "special": true,
    "rev": "a0395e27c2"
  },
  "화산 군주": {
    "elem": "fire",
    "shape": "beast",
    "tier": 7,
    "special": true,
    "rev": "b42bae8505"
  },
  "뇌운의 왕": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 7,
    "special": true,
    "rev": "372ea01e72"
  },
  "심해 포식자": {
    "elem": "water",
    "shape": "slime",
    "tier": 7,
    "special": true,
    "rev": "e386cf1e2e"
  },
  "타락한 성기사": {
    "elem": "holy",
    "shape": "eye",
    "tier": 7,
    "special": true,
    "rev": "e3ca48adc1"
  },
  "그림자 군주": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 7,
    "special": true,
    "rev": "4c030a3a47"
  }
};
