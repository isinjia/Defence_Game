// 종별 원화 연결 정보. 표시 파일을 다시 만들 때 함께 갱신한다.
const MONSTER_ART_DATA = {
  "가시털 들개": {
    "elem": "wood",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "8b74fe1be1"
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
    "rev": "6abd28fb2a"
  },
  "망자의 합창단": {
    "elem": "dark",
    "shape": "choir",
    "tier": 3,
    "special": false,
    "rev": "eee63f8989"
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
    "rev": "f4fe902c7b"
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
    "rev": "27f25190e2"
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
    "rev": "588a82a1cc"
  },
  "독안개 버섯": {
    "elem": "wood",
    "shape": "slime",
    "tier": 1,
    "special": false,
    "rev": "3c0f26aa5e"
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
    "rev": "06345bbe8d"
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
    "rev": "e9c92f5f6c"
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
    "rev": "ee96c02a0f"
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
    "rev": "42798751ba"
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
    "rev": "84e8c34f96"
  },
  "광휘의 성자": {
    "elem": "holy",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "bd45fd9079"
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
    "rev": "f90b862d6a"
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
    "rev": "43c1dd45ee"
  },
  "골목 들쥐떼": {
    "elem": "wood",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "07f0fc0a71"
  },
  "옥상 까마귀": {
    "elem": "bolt",
    "shape": "flyer",
    "tier": 0,
    "special": false,
    "rev": "302bc12d16"
  },
  "지하상가 구더기": {
    "elem": "wood",
    "shape": "slime",
    "tier": 0,
    "special": false,
    "rev": "89ca245ce6"
  },
  "담벼락 이끼괴": {
    "elem": "wood",
    "shape": "slime",
    "tier": 0,
    "special": false,
    "rev": "71e6deda16"
  },
  "빈집 유령고양이": {
    "elem": "dark",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "9375f667af"
  },
  "버스정류장 그림자": {
    "elem": "bolt",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "4b818f1e32"
  },
  "자판기 미믹": {
    "elem": "bolt",
    "shape": "mimic",
    "tier": 2,
    "special": false,
    "rev": "1a83f089d8"
  },
  "폐교 운동장 개": {
    "elem": "wood",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "cb9f7a6d31"
  },
  "공사장 크레인령": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "fc44407799"
  },
  "도심 스모그정령": {
    "elem": "fire",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "8f5f146541"
  },
  "네온 흡혈박쥐": {
    "elem": "fire",
    "shape": "flyer",
    "tier": 2,
    "special": false,
    "rev": "a8950a8d86"
  },
  "엘리베이터 손": {
    "elem": "bolt",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "5170ce8949"
  },
  "옥상정원 덩굴": {
    "elem": "wood",
    "shape": "spider",
    "tier": 3,
    "special": false,
    "rev": "881254a698"
  },
  "골목상인 꼭두": {
    "elem": "holy",
    "shape": "humanoid",
    "tier": 2,
    "special": false,
    "rev": "f1c6c14586"
  },
  "철근 골렘": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "a9270a4ff6"
  },
  "야간순찰 로봇잔해": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 3,
    "special": false,
    "rev": "2da3eb4e87"
  },
  "광고판 얼굴": {
    "elem": "holy",
    "shape": "eye",
    "tier": 4,
    "special": false,
    "rev": "fc83e27504"
  },
  "지하주차장 하이에나": {
    "elem": "fire",
    "shape": "beast",
    "tier": 3,
    "special": false,
    "rev": "c21772961d"
  },
  "아파트 층간괴": {
    "elem": "water",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "f1042e3b12"
  },
  "도심 키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 5,
    "special": false,
    "rev": "e98ebf76f3"
  },
  "절벽 산양": {
    "elem": "wood",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "584553a7f1"
  },
  "안개 독수리": {
    "elem": "bolt",
    "shape": "flyer",
    "tier": 1,
    "special": false,
    "rev": "ebd773ecc7"
  },
  "바위이끼 거북": {
    "elem": "wood",
    "shape": "golem",
    "tier": 1,
    "special": false,
    "rev": "919f245c34"
  },
  "바람길 요정벌레": {
    "elem": "holy",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "ca64e047d0"
  },
  "눈사태 늑대": {
    "elem": "water",
    "shape": "beast",
    "tier": 2,
    "special": false,
    "rev": "cd0e8d2a00"
  },
  "암벽 도마뱀": {
    "elem": "fire",
    "shape": "beast",
    "tier": 2,
    "special": false,
    "rev": "222dba0f5e"
  },
  "구름다리 하피": {
    "elem": "bolt",
    "shape": "flyer",
    "tier": 3,
    "special": false,
    "rev": "fb62c63d1e"
  },
  "산신령 석상": {
    "elem": "holy",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "e4dcdb46f1"
  },
  "벼랑 끝 와이번": {
    "elem": "bolt",
    "shape": "dragon",
    "tier": 5,
    "special": false,
    "rev": "ea70423ea6"
  },
  "태백 설녀": {
    "elem": "water",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "4eaed0a26d"
  },
  "지리산 나무정령": {
    "elem": "wood",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "e8733f0ed3"
  },
  "한라 용암도롱뇽": {
    "elem": "fire",
    "shape": "slime",
    "tier": 3,
    "special": false,
    "rev": "f60a44093c"
  },
  "설악 얼음거미": {
    "elem": "water",
    "shape": "spider",
    "tier": 4,
    "special": false,
    "rev": "066189cfa3"
  },
  "백두 분화 파편": {
    "elem": "fire",
    "shape": "core",
    "tier": 6,
    "special": false,
    "rev": "142d2d8c1b"
  },
  "개마고원 설랑": {
    "elem": "water",
    "shape": "beast",
    "tier": 5,
    "special": false,
    "rev": "6ad0ccbe37"
  },
  "봉우리 뇌룡": {
    "elem": "bolt",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "c857047fe9"
  },
  "산봉 성광새": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 2,
    "special": false,
    "rev": "8799b8b158"
  },
  "협곡 메아리령": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "30b79bcd95"
  },
  "암반 분쇄자": {
    "elem": "wood",
    "shape": "golem",
    "tier": 5,
    "special": false,
    "rev": "6fd259a9b2"
  },
  "정상 감시안": {
    "elem": "holy",
    "shape": "eye",
    "tier": 6,
    "special": false,
    "rev": "dac894a894"
  },
  "갯벌 게무리": {
    "elem": "water",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "cff190fce4"
  },
  "부표 해파리": {
    "elem": "water",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "d5556f9451"
  },
  "방파제 문어": {
    "elem": "water",
    "shape": "spider",
    "tier": 2,
    "special": false,
    "rev": "221588b9c1"
  },
  "등대 불빛령": {
    "elem": "holy",
    "shape": "core",
    "tier": 1,
    "special": false,
    "rev": "127bcd2448"
  },
  "침몰선 선원령": {
    "elem": "water",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "04f3bb8c3a"
  },
  "해무 세이렌": {
    "elem": "water",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "4556b65b3e"
  },
  "조개껍질 골렘": {
    "elem": "water",
    "shape": "golem",
    "tier": 2,
    "special": false,
    "rev": "38e9a69939"
  },
  "해협 번개장어": {
    "elem": "bolt",
    "shape": "beast",
    "tier": 3,
    "special": false,
    "rev": "6ede7db308"
  },
  "심해 아귀": {
    "elem": "dark",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "c5f8f1c148"
  },
  "산호 정원수호": {
    "elem": "holy",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "978da63b92"
  },
  "파도 기수": {
    "elem": "water",
    "shape": "flyer",
    "tier": 4,
    "special": false,
    "rev": "3e5315e96b"
  },
  "등대지기 미믹": {
    "elem": "bolt",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "48d5c1a75b"
  },
  "난파 포탄": {
    "elem": "fire",
    "shape": "core",
    "tier": 4,
    "special": false,
    "rev": "5ddb34b272"
  },
  "해안 가시불가사리": {
    "elem": "wood",
    "shape": "spider",
    "tier": 1,
    "special": false,
    "rev": "43aa231b08"
  },
  "조류 소용돌이핵": {
    "elem": "water",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "b8025c02b3"
  },
  "잠수함 잔해령": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 5,
    "special": false,
    "rev": "1e138b41a9"
  },
  "동해 심연왕자": {
    "elem": "water",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "2f61cd486e"
  },
  "해협 뇌룡": {
    "elem": "bolt",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "9df2168788"
  },
  "어부의 원한": {
    "elem": "water",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "1584fbf42c"
  },
  "해상도시 부유괴": {
    "elem": "bolt",
    "shape": "slime",
    "tier": 5,
    "special": false,
    "rev": "0261c37b7f"
  },
  "포자 다람쥐": {
    "elem": "wood",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "8fa66db4b7"
  },
  "에테르 반딧불": {
    "elem": "holy",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "256f5b8452"
  },
  "뿌리 포식자": {
    "elem": "wood",
    "shape": "spider",
    "tier": 1,
    "special": false,
    "rev": "4dfb8451a0"
  },
  "이슬 슬라임": {
    "elem": "water",
    "shape": "slime",
    "tier": 1,
    "special": false,
    "rev": "3653ba08e5"
  },
  "고목 올빼미": {
    "elem": "wood",
    "shape": "flyer",
    "tier": 2,
    "special": false,
    "rev": "1b7f46a72d"
  },
  "버섯 주술사": {
    "elem": "wood",
    "shape": "humanoid",
    "tier": 2,
    "special": false,
    "rev": "50a7cf008a"
  },
  "덩굴 올가미": {
    "elem": "wood",
    "shape": "spider",
    "tier": 3,
    "special": false,
    "rev": "c308f79e7c"
  },
  "숲의 수호상": {
    "elem": "holy",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "79fd5d89b0"
  },
  "에테르 사슴": {
    "elem": "holy",
    "shape": "beast",
    "tier": 2,
    "special": false,
    "rev": "2a9caa3019"
  },
  "오염 꽃정령": {
    "elem": "fire",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "87cc44e53a"
  },
  "세계수 수액정": {
    "elem": "wood",
    "shape": "slime",
    "tier": 4,
    "special": false,
    "rev": "7153358b6f"
  },
  "밤나무 거미왕": {
    "elem": "dark",
    "shape": "spider",
    "tier": 4,
    "special": false,
    "rev": "094e53f24a"
  },
  "숲안개 환영": {
    "elem": "wood",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "dac5a7cca0"
  },
  "금빛 사슴신": {
    "elem": "holy",
    "shape": "beast",
    "tier": 5,
    "special": false,
    "rev": "de03a957d8"
  },
  "고목 심장": {
    "elem": "wood",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "b6269a43df"
  },
  "에테르 늑대군주": {
    "elem": "bolt",
    "shape": "beast",
    "tier": 5,
    "special": false,
    "rev": "86d4052363"
  },
  "뿌리왕관": {
    "elem": "wood",
    "shape": "golem",
    "tier": 6,
    "special": false,
    "rev": "e54d1e27cc"
  },
  "숲의 심판자": {
    "elem": "holy",
    "shape": "eye",
    "tier": 6,
    "special": false,
    "rev": "dc5c6f8064"
  },
  "타락 세계수": {
    "elem": "dark",
    "shape": "spider",
    "tier": 7,
    "special": false,
    "rev": "3d52e71ad0"
  },
  "태고 수호룡": {
    "elem": "wood",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "a7621b1c12"
  },
  "용접불티 쥐": {
    "elem": "fire",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "1a3eb2aaee"
  },
  "컨베이어 톱니벌레": {
    "elem": "bolt",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "c1428fc6cd"
  },
  "냉각수 슬라임": {
    "elem": "water",
    "shape": "slime",
    "tier": 1,
    "special": false,
    "rev": "5584b0eb6d"
  },
  "안전모 고블린": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 1,
    "special": false,
    "rev": "c2cb9dfcf4"
  },
  "경보등 드론": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 1,
    "special": false,
    "rev": "00b667cdfd"
  },
  "녹슨 지게차령": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 2,
    "special": false,
    "rev": "3680390f4d"
  },
  "용광로 임프": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 2,
    "special": false,
    "rev": "072db726c0"
  },
  "서버랙 거미": {
    "elem": "bolt",
    "shape": "spider",
    "tier": 3,
    "special": false,
    "rev": "b7f53a1f48"
  },
  "냉각탑 안개": {
    "elem": "water",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "13851840b1"
  },
  "회로기판 미믹": {
    "elem": "bolt",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "7906288b12"
  },
  "용암주조 골렘": {
    "elem": "fire",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "200aa76af5"
  },
  "과부하 코어": {
    "elem": "bolt",
    "shape": "core",
    "tier": 4,
    "special": false,
    "rev": "32b134681f"
  },
  "자동화 경비병": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 3,
    "special": false,
    "rev": "37e4f79010"
  },
  "산업폐기 키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "548ed0f249"
  },
  "데이터 유령군단": {
    "elem": "dark",
    "shape": "choir",
    "tier": 4,
    "special": false,
    "rev": "a99f0fd0ad"
  },
  "공장장 잔상": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 5,
    "special": false,
    "rev": "edb87ce24a"
  },
  "메카 파괴자": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 6,
    "special": false,
    "rev": "718d6282d4"
  },
  "태양로 잔해": {
    "elem": "fire",
    "shape": "core",
    "tier": 6,
    "special": false,
    "rev": "1537010816"
  },
  "블랙아웃 군주": {
    "elem": "dark",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "b8e992a9cf"
  },
  "강철심장 거병": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 7,
    "special": false,
    "rev": "c90cfbe1c5"
  },
  "링거줄 슬라임": {
    "elem": "water",
    "shape": "slime",
    "tier": 0,
    "special": false,
    "rev": "8401e73834"
  },
  "마스크 유령": {
    "elem": "bolt",
    "shape": "ghost",
    "tier": 0,
    "special": false,
    "rev": "198931f0bb"
  },
  "구급차 사이렌령": {
    "elem": "bolt",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "651ce1546b"
  },
  "수술실 그림자": {
    "elem": "wood",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "1ae239ef50"
  },
  "의무기록 미믹": {
    "elem": "bolt",
    "shape": "mimic",
    "tier": 2,
    "special": false,
    "rev": "03de3069ec"
  },
  "간호 드론": {
    "elem": "holy",
    "shape": "drone",
    "tier": 1,
    "special": false,
    "rev": "1369c6eeac"
  },
  "시체안치 수호": {
    "elem": "wood",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "d71221b21b"
  },
  "병동 울음소리": {
    "elem": "water",
    "shape": "choir",
    "tier": 2,
    "special": false,
    "rev": "5e3a28fa48"
  },
  "주사기 벌레떼": {
    "elem": "wood",
    "shape": "swarm",
    "tier": 1,
    "special": false,
    "rev": "c8504ae735"
  },
  "의사가운 기사": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 4,
    "special": false,
    "rev": "e9e0ac059d"
  },
  "격리실 독무": {
    "elem": "wood",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "a30537e7f6"
  },
  "심전도 눈": {
    "elem": "bolt",
    "shape": "eye",
    "tier": 4,
    "special": false,
    "rev": "0b7cda376b"
  },
  "장기보관 키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "541666e65d"
  },
  "영안실 세이렌": {
    "elem": "water",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "14a45b4ed8"
  },
  "백의의 타락자": {
    "elem": "holy",
    "shape": "humanoid",
    "tier": 5,
    "special": false,
    "rev": "a896389db0"
  },
  "전염 군단핵": {
    "elem": "dark",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "9295ee76ce"
  },
  "심판 의무관": {
    "elem": "holy",
    "shape": "eye",
    "tier": 6,
    "special": false,
    "rev": "b12b6f1aca"
  },
  "흑사 대주교": {
    "elem": "dark",
    "shape": "choir",
    "tier": 6,
    "special": false,
    "rev": "c09c354dd8"
  },
  "불멸 실험체": {
    "elem": "dark",
    "shape": "beast",
    "tier": 7,
    "special": false,
    "rev": "3bdea0f2d9"
  },
  "종말 의무실장": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 7,
    "special": false,
    "rev": "36fa871f68"
  },
  "성수 비둘기": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 0,
    "special": false,
    "rev": "924c069ae3"
  },
  "향로 연기령": {
    "elem": "holy",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "4be9713841"
  },
  "돌사자": {
    "elem": "holy",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "9a4dda6e42"
  },
  "제단 불꽃": {
    "elem": "fire",
    "shape": "core",
    "tier": 2,
    "special": false,
    "rev": "e5093070ea"
  },
  "기도하는 석상": {
    "elem": "holy",
    "shape": "golem",
    "tier": 2,
    "special": false,
    "rev": "e509bc21f6"
  },
  "타락한 성가대": {
    "elem": "dark",
    "shape": "choir",
    "tier": 3,
    "special": false,
    "rev": "ae19c3b161"
  },
  "성물 미믹": {
    "elem": "holy",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "98cf857448"
  },
  "날개 부러진 천사": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 4,
    "special": false,
    "rev": "7dfc929a7e"
  },
  "신전 수호룡": {
    "elem": "holy",
    "shape": "dragon",
    "tier": 5,
    "special": false,
    "rev": "889dd069bd"
  },
  "속죄의 눈": {
    "elem": "holy",
    "shape": "eye",
    "tier": 4,
    "special": false,
    "rev": "265ec9aff0"
  },
  "이단 주술사": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 3,
    "special": false,
    "rev": "7f0facaa92"
  },
  "금빛 가고일": {
    "elem": "holy",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "ce63c231ea"
  },
  "성흔 기사": {
    "elem": "holy",
    "shape": "humanoid",
    "tier": 5,
    "special": false,
    "rev": "527ddc50a3"
  },
  "타락 성배": {
    "elem": "dark",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "c9e88a617e"
  },
  "광휘 세라프": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 6,
    "special": false,
    "rev": "f4e84054e9"
  },
  "심연 사제": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 6,
    "special": false,
    "rev": "cea587be4f"
  },
  "심판의 종": {
    "elem": "holy",
    "shape": "golem",
    "tier": 6,
    "special": false,
    "rev": "fb99d8ac6a"
  },
  "원죄의 용": {
    "elem": "dark",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "6ecba28e7c"
  },
  "성역의 군주": {
    "elem": "holy",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "e8f526bee2"
  },
  "봉인 파수꾼": {
    "elem": "holy",
    "shape": "golem",
    "tier": 7,
    "special": false,
    "rev": "a88cbfc225"
  },
  "동토 들개": {
    "elem": "water",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "5b3e608bbf"
  },
  "얼음가시 쥐": {
    "elem": "water",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "d87336e285"
  },
  "폐허초소 유령": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "fc4ec6035c"
  },
  "동결 드론": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 2,
    "special": false,
    "rev": "3a8ac64350"
  },
  "벙커문 수호": {
    "elem": "bolt",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "84e066406f"
  },
  "설원 하피": {
    "elem": "water",
    "shape": "flyer",
    "tier": 3,
    "special": false,
    "rev": "f1ac353047"
  },
  "동면 거미": {
    "elem": "dark",
    "shape": "spider",
    "tier": 3,
    "special": false,
    "rev": "2a0d148abb"
  },
  "봉쇄선 파편체": {
    "elem": "bolt",
    "shape": "core",
    "tier": 4,
    "special": false,
    "rev": "9af01956b4"
  },
  "얼어붙은 합창": {
    "elem": "water",
    "shape": "choir",
    "tier": 4,
    "special": false,
    "rev": "768f643d8b"
  },
  "백두 재 늑대": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "8db168d99b"
  },
  "평양 지하 미믹": {
    "elem": "dark",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "1ea53693c0"
  },
  "개마 설랑군주": {
    "elem": "water",
    "shape": "beast",
    "tier": 5,
    "special": false,
    "rev": "5e0754fb2b"
  },
  "비무장지대 키메라": {
    "elem": "wood",
    "shape": "beast",
    "tier": 5,
    "special": false,
    "rev": "5292d874d7"
  },
  "봉쇄 감시안": {
    "elem": "holy",
    "shape": "eye",
    "tier": 5,
    "special": false,
    "rev": "298f56e625"
  },
  "동토 고룡": {
    "elem": "water",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "5a7dbcc5a1"
  },
  "분화구 마그마룡": {
    "elem": "fire",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "aeb806d18b"
  },
  "잠든 수도의 왕": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 7,
    "special": false,
    "rev": "92f2012054"
  },
  "동토 성역수호": {
    "elem": "holy",
    "shape": "golem",
    "tier": 6,
    "special": false,
    "rev": "2ab7e7da44"
  },
  "백두 심연핵": {
    "elem": "dark",
    "shape": "core",
    "tier": 7,
    "special": false,
    "rev": "ededc4ade7"
  },
  "동토의 심판자": {
    "elem": "bolt",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "7ca3f01f48"
  },
  "균열 기생충": {
    "elem": "dark",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "fd91933ae5"
  },
  "뒤틀린 슬라임": {
    "elem": "dark",
    "shape": "slime",
    "tier": 1,
    "special": false,
    "rev": "ee481491cb"
  },
  "붉은 안개쥐": {
    "elem": "fire",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "0eccb54f34"
  },
  "이중그림자": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "f2ece6ce46"
  },
  "등급위조 드론": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 2,
    "special": false,
    "rev": "f2d8c0bc19"
  },
  "출구없는 미믹": {
    "elem": "dark",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "ca2b99c027"
  },
  "적신호 골렘": {
    "elem": "fire",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "86c57a8437"
  },
  "변이 키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "c3f699a83f"
  },
  "봉인파열핵": {
    "elem": "dark",
    "shape": "core",
    "tier": 4,
    "special": false,
    "rev": "b2de8dbdd8"
  },
  "거짓등급 군주": {
    "elem": "holy",
    "shape": "eye",
    "tier": 5,
    "special": false,
    "rev": "a9fa1c9acf"
  },
  "이중문 수호룡": {
    "elem": "dark",
    "shape": "dragon",
    "tier": 5,
    "special": false,
    "rev": "1ec4268088"
  },
  "원초의 파편": {
    "elem": "dark",
    "shape": "core",
    "tier": 6,
    "special": false,
    "rev": "3773498cc9"
  },
  "심연 열쇠지기": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 6,
    "special": false,
    "rev": "978d8d001d"
  },
  "균열 와이번": {
    "elem": "bolt",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "995c900820"
  },
  "대붕괴의 메아리": {
    "elem": "dark",
    "shape": "choir",
    "tier": 5,
    "special": false,
    "rev": "4e819a315b"
  },
  "열린문의 눈": {
    "elem": "dark",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "f907d4f27e"
  },
  "원초 감시자": {
    "elem": "dark",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "f432f8c120"
  },
  "심연의 파편룡": {
    "elem": "dark",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "de93a8f893"
  },
  "봉인 잔해병": {
    "elem": "holy",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "f94f96ab96"
  },
  "붉은 태양잔해": {
    "elem": "fire",
    "shape": "core",
    "tier": 7,
    "special": false,
    "rev": "309c7e9012"
  },
  "분지 열기쥐": {
    "elem": "fire",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "512469aea8"
  },
  "에테르 거품슬라임": {
    "elem": "fire",
    "shape": "slime",
    "tier": 2,
    "special": false,
    "rev": "7c91befe17"
  },
  "둥지 새끼거미": {
    "elem": "wood",
    "shape": "spider",
    "tier": 1,
    "special": false,
    "rev": "4b8be5e9b2"
  },
  "열풍 하피": {
    "elem": "fire",
    "shape": "flyer",
    "tier": 3,
    "special": false,
    "rev": "465fc24283"
  }
};
