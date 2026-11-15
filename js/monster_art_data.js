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
    "rev": "9860c5c8d9"
  },
  "전기 날벌레떼": {
    "elem": "bolt",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "ae79502489"
  },
  "빛무리 드론": {
    "elem": "holy",
    "shape": "drone",
    "tier": 1,
    "special": false,
    "rev": "d3f0fc801c"
  },
  "불꽃 쥐": {
    "elem": "fire",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "99e817ec92"
  },
  "이끼 골렘": {
    "elem": "wood",
    "shape": "golem",
    "tier": 2,
    "special": false,
    "rev": "d68e66594c"
  },
  "서리 늑대": {
    "elem": "water",
    "shape": "beast",
    "tier": 2,
    "special": false,
    "rev": "5552cf5f06"
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
    "rev": "99d71c19dd"
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
    "rev": "85eb3e0b67"
  },
  "천둥 기수": {
    "elem": "bolt",
    "shape": "flyer",
    "tier": 5,
    "special": false,
    "rev": "501c6de462"
  },
  "심판의 눈": {
    "elem": "holy",
    "shape": "eye",
    "tier": 5,
    "special": false,
    "rev": "34e82bd276"
  },
  "적룡 파편체": {
    "elem": "fire",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "a7d48d9599"
  },
  "폭풍 와이번": {
    "elem": "bolt",
    "shape": "dragon",
    "tier": 6,
    "special": false,
    "rev": "948a2dc450"
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
    "rev": "9f5b36aab5"
  },
  "심연 감시자": {
    "elem": "dark",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "ddef329e16"
  },
  "태양의 잔해": {
    "elem": "fire",
    "shape": "core",
    "tier": 7,
    "special": false,
    "rev": "2a9cbf1eb5"
  },
  "하수구 고블린": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 0,
    "special": false,
    "rev": "53d1532bc9"
  },
  "잿불 임프": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 0,
    "special": false,
    "rev": "4759bbef1f"
  },
  "성광 반딧불": {
    "elem": "holy",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "6fd0d1fb6f"
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
    "rev": "52a4531e73"
  },
  "오크 약탈자": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 2,
    "special": false,
    "rev": "5749035179"
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
    "rev": "5f1a408aac"
  },
  "병동의 그림자": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "801c910c2d"
  },
  "미믹": {
    "elem": "dark",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "eb83ae5092"
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
    "rev": "c0330c9edd"
  },
  "언데드 기사": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 4,
    "special": false,
    "rev": "f08d46c9c2"
  },
  "키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "709ea28fb4"
  },
  "오크 주술사": {
    "elem": "wood",
    "shape": "humanoid",
    "tier": 4,
    "special": false,
    "rev": "15d1b94719"
  },
  "성역 수호상": {
    "elem": "holy",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "8df4fb8071"
  },
  "서버 망령": {
    "elem": "bolt",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "3b81b4223b"
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
    "rev": "d64621e30b"
  },
  "오크 대족장": {
    "elem": "fire",
    "shape": "humanoid",
    "tier": 6,
    "special": false,
    "rev": "a7614a23a2"
  },
  "타락 천사": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 6,
    "special": false,
    "rev": "ff2989ddf7"
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
    "rev": "c5604f2888"
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
    "rev": "837fa8445d"
  },
  "심연의 군주": {
    "elem": "dark",
    "shape": "lord",
    "tier": 7,
    "special": true,
    "rev": "76e2f73774"
  },
  "화산 군주": {
    "elem": "fire",
    "shape": "beast",
    "tier": 7,
    "special": true,
    "rev": "82dce94634"
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
    "rev": "537a425c90"
  },
  "타락한 성기사": {
    "elem": "holy",
    "shape": "eye",
    "tier": 7,
    "special": true,
    "rev": "106868b62c"
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
    "rev": "fd49bd8b6a"
  },
  "지하상가 구더기": {
    "elem": "wood",
    "shape": "slime",
    "tier": 0,
    "special": false,
    "rev": "a1a958ef93"
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
    "rev": "ab2da4c04c"
  },
  "버스정류장 그림자": {
    "elem": "bolt",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "61ef0e4e0b"
  },
  "자판기 미믹": {
    "elem": "bolt",
    "shape": "mimic",
    "tier": 2,
    "special": false,
    "rev": "3382b6c5f0"
  },
  "폐교 운동장 개": {
    "elem": "wood",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "2122b72d19"
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
    "rev": "1747c4370b"
  },
  "옥상정원 덩굴": {
    "elem": "wood",
    "shape": "spider",
    "tier": 3,
    "special": false,
    "rev": "d12b6711d0"
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
    "rev": "44800ee073"
  },
  "야간순찰 로봇잔해": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 3,
    "special": false,
    "rev": "4b205afe1c"
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
    "rev": "58a1184c9f"
  },
  "아파트 층간괴": {
    "elem": "water",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "f9be9bf6f8"
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
    "rev": "0693fae764"
  },
  "안개 독수리": {
    "elem": "bolt",
    "shape": "flyer",
    "tier": 1,
    "special": false,
    "rev": "70c995a4d7"
  },
  "바위이끼 거북": {
    "elem": "wood",
    "shape": "golem",
    "tier": 1,
    "special": false,
    "rev": "a943e5ab77"
  },
  "바람길 요정벌레": {
    "elem": "holy",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "b992274eca"
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
    "rev": "eba95578f3"
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
    "rev": "064bca9170"
  },
  "벼랑 끝 와이번": {
    "elem": "bolt",
    "shape": "dragon",
    "tier": 5,
    "special": false,
    "rev": "750b6fe77f"
  },
  "태백 설녀": {
    "elem": "water",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "5d30abd96d"
  },
  "지리산 나무정령": {
    "elem": "wood",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "c03d12ab10"
  },
  "한라 용암도롱뇽": {
    "elem": "fire",
    "shape": "slime",
    "tier": 3,
    "special": false,
    "rev": "de1727137b"
  },
  "설악 얼음거미": {
    "elem": "water",
    "shape": "spider",
    "tier": 4,
    "special": false,
    "rev": "4a4ea94ab5"
  },
  "백두 분화 파편": {
    "elem": "fire",
    "shape": "core",
    "tier": 6,
    "special": false,
    "rev": "122a170c31"
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
    "rev": "0de6c72ea7"
  },
  "산봉 성광새": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 2,
    "special": false,
    "rev": "f5b6cd8d73"
  },
  "협곡 메아리령": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "44be09aeb9"
  },
  "암반 분쇄자": {
    "elem": "wood",
    "shape": "golem",
    "tier": 5,
    "special": false,
    "rev": "ba36e79d73"
  },
  "정상 감시안": {
    "elem": "holy",
    "shape": "eye",
    "tier": 6,
    "special": false,
    "rev": "1db218956e"
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
    "rev": "5563053bcb"
  },
  "방파제 문어": {
    "elem": "water",
    "shape": "spider",
    "tier": 2,
    "special": false,
    "rev": "2c0397e5d6"
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
    "rev": "b33e595cd5"
  },
  "해무 세이렌": {
    "elem": "water",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "c1d2ee457d"
  },
  "조개껍질 골렘": {
    "elem": "water",
    "shape": "golem",
    "tier": 2,
    "special": false,
    "rev": "74d1611edc"
  },
  "해협 번개장어": {
    "elem": "bolt",
    "shape": "beast",
    "tier": 3,
    "special": false,
    "rev": "d60272685d"
  },
  "심해 아귀": {
    "elem": "dark",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "2aa8824b16"
  },
  "산호 정원수호": {
    "elem": "holy",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "b729b62b9a"
  },
  "파도 기수": {
    "elem": "water",
    "shape": "flyer",
    "tier": 4,
    "special": false,
    "rev": "af7a5319fe"
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
    "rev": "4483652282"
  },
  "조류 소용돌이핵": {
    "elem": "water",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "7ea261bff2"
  },
  "잠수함 잔해령": {
    "elem": "bolt",
    "shape": "drone",
    "tier": 5,
    "special": false,
    "rev": "6643f7b2cd"
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
    "rev": "c42eeac1c8"
  },
  "어부의 원한": {
    "elem": "water",
    "shape": "ghost",
    "tier": 4,
    "special": false,
    "rev": "723e3f4b4f"
  },
  "해상도시 부유괴": {
    "elem": "bolt",
    "shape": "slime",
    "tier": 5,
    "special": false,
    "rev": "5e08db06df"
  },
  "포자 다람쥐": {
    "elem": "wood",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "141dbe7f6c"
  },
  "에테르 반딧불": {
    "elem": "holy",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "ab858c0c1f"
  },
  "뿌리 포식자": {
    "elem": "wood",
    "shape": "spider",
    "tier": 1,
    "special": false,
    "rev": "679719d98a"
  },
  "이슬 슬라임": {
    "elem": "water",
    "shape": "slime",
    "tier": 1,
    "special": false,
    "rev": "c8626ae3de"
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
    "rev": "adf834d06d"
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
    "rev": "7fcce7f21b"
  },
  "에테르 사슴": {
    "elem": "holy",
    "shape": "beast",
    "tier": 2,
    "special": false,
    "rev": "2f4c564b7c"
  },
  "오염 꽃정령": {
    "elem": "fire",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "e95e2c59f8"
  },
  "세계수 수액정": {
    "elem": "wood",
    "shape": "slime",
    "tier": 4,
    "special": false,
    "rev": "b3fac87627"
  },
  "밤나무 거미왕": {
    "elem": "dark",
    "shape": "spider",
    "tier": 4,
    "special": false,
    "rev": "b008e2953c"
  },
  "숲안개 환영": {
    "elem": "wood",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "fc9ef38073"
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
    "rev": "a97c24c59e"
  },
  "뿌리왕관": {
    "elem": "wood",
    "shape": "golem",
    "tier": 6,
    "special": false,
    "rev": "c67010e7c1"
  },
  "숲의 심판자": {
    "elem": "holy",
    "shape": "eye",
    "tier": 6,
    "special": false,
    "rev": "098157de04"
  },
  "타락 세계수": {
    "elem": "dark",
    "shape": "spider",
    "tier": 7,
    "special": false,
    "rev": "e10d58f74f"
  },
  "태고 수호룡": {
    "elem": "wood",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "427f311b1f"
  },
  "용접불티 쥐": {
    "elem": "fire",
    "shape": "beast",
    "tier": 0,
    "special": false,
    "rev": "fc952cc8be"
  },
  "컨베이어 톱니벌레": {
    "elem": "bolt",
    "shape": "swarm",
    "tier": 0,
    "special": false,
    "rev": "c3effff0bf"
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
    "rev": "70eae275e1"
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
    "rev": "93d8d5d509"
  },
  "서버랙 거미": {
    "elem": "bolt",
    "shape": "spider",
    "tier": 3,
    "special": false,
    "rev": "9ce13553c7"
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
    "rev": "c82f903baa"
  },
  "용암주조 골렘": {
    "elem": "fire",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "d47490c397"
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
    "rev": "3c4bb43540"
  },
  "산업폐기 키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "0af7d1bddc"
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
    "rev": "626cc69352"
  },
  "태양로 잔해": {
    "elem": "fire",
    "shape": "core",
    "tier": 6,
    "special": false,
    "rev": "1da12ccba9"
  },
  "블랙아웃 군주": {
    "elem": "dark",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "7be3b268a5"
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
    "rev": "4504ba146f"
  },
  "의무기록 미믹": {
    "elem": "bolt",
    "shape": "mimic",
    "tier": 2,
    "special": false,
    "rev": "90de51c5fb"
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
    "rev": "8ba92723b2"
  },
  "병동 울음소리": {
    "elem": "water",
    "shape": "choir",
    "tier": 2,
    "special": false,
    "rev": "7a5f16472d"
  },
  "주사기 벌레떼": {
    "elem": "wood",
    "shape": "swarm",
    "tier": 1,
    "special": false,
    "rev": "a0262ad14e"
  },
  "의사가운 기사": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 4,
    "special": false,
    "rev": "7186f9dc03"
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
    "rev": "cc0dbb1f9b"
  },
  "장기보관 키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "66c063e477"
  },
  "영안실 세이렌": {
    "elem": "water",
    "shape": "ghost",
    "tier": 3,
    "special": false,
    "rev": "76dd8395e0"
  },
  "백의의 타락자": {
    "elem": "holy",
    "shape": "humanoid",
    "tier": 5,
    "special": false,
    "rev": "648fb4cccc"
  },
  "전염 군단핵": {
    "elem": "dark",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "49656da33d"
  },
  "심판 의무관": {
    "elem": "holy",
    "shape": "eye",
    "tier": 6,
    "special": false,
    "rev": "3b2b5d0ca0"
  },
  "흑사 대주교": {
    "elem": "dark",
    "shape": "choir",
    "tier": 6,
    "special": false,
    "rev": "57840bafe5"
  },
  "불멸 실험체": {
    "elem": "dark",
    "shape": "beast",
    "tier": 7,
    "special": false,
    "rev": "5f06879665"
  },
  "종말 의무실장": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 7,
    "special": false,
    "rev": "cb60469e93"
  },
  "성수 비둘기": {
    "elem": "holy",
    "shape": "flyer",
    "tier": 0,
    "special": false,
    "rev": "5d9f274f45"
  },
  "향로 연기령": {
    "elem": "holy",
    "shape": "ghost",
    "tier": 1,
    "special": false,
    "rev": "679b858a69"
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
    "rev": "4936472a78"
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
    "rev": "788e527513"
  },
  "성물 미믹": {
    "elem": "holy",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "d4ae0dec9a"
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
    "rev": "5609c193e5"
  },
  "속죄의 눈": {
    "elem": "holy",
    "shape": "eye",
    "tier": 4,
    "special": false,
    "rev": "f9ebc401e0"
  },
  "이단 주술사": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 3,
    "special": false,
    "rev": "d958de7187"
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
    "rev": "f1b82fdd53"
  },
  "타락 성배": {
    "elem": "dark",
    "shape": "core",
    "tier": 5,
    "special": false,
    "rev": "6f60013f8d"
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
    "rev": "5364733fea"
  },
  "심판의 종": {
    "elem": "holy",
    "shape": "golem",
    "tier": 6,
    "special": false,
    "rev": "9d9aaa93ee"
  },
  "원죄의 용": {
    "elem": "dark",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "861b0abe90"
  },
  "성역의 군주": {
    "elem": "holy",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "31c4b274b4"
  },
  "봉인 파수꾼": {
    "elem": "holy",
    "shape": "golem",
    "tier": 7,
    "special": false,
    "rev": "ce6573c755"
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
    "rev": "9143e16b70"
  },
  "폐허초소 유령": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "ee8a098499"
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
    "rev": "41c2e23d7c"
  },
  "설원 하피": {
    "elem": "water",
    "shape": "flyer",
    "tier": 3,
    "special": false,
    "rev": "c84ad73151"
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
    "rev": "3b54e33116"
  },
  "얼어붙은 합창": {
    "elem": "water",
    "shape": "choir",
    "tier": 4,
    "special": false,
    "rev": "24702f4a29"
  },
  "백두 재 늑대": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "ac30795516"
  },
  "평양 지하 미믹": {
    "elem": "dark",
    "shape": "mimic",
    "tier": 3,
    "special": false,
    "rev": "fb6b2849c2"
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
    "rev": "b20bae741a"
  },
  "봉쇄 감시안": {
    "elem": "holy",
    "shape": "eye",
    "tier": 5,
    "special": false,
    "rev": "989cabb367"
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
    "rev": "ec8a8c1f5c"
  },
  "잠든 수도의 왕": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 7,
    "special": false,
    "rev": "639e9b902a"
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
    "rev": "7cbd521deb"
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
    "rev": "a2e109e590"
  },
  "이중그림자": {
    "elem": "dark",
    "shape": "ghost",
    "tier": 2,
    "special": false,
    "rev": "efe965a0dd"
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
    "rev": "54d580de27"
  },
  "적신호 골렘": {
    "elem": "fire",
    "shape": "golem",
    "tier": 3,
    "special": false,
    "rev": "7efc87a180"
  },
  "변이 키메라": {
    "elem": "fire",
    "shape": "beast",
    "tier": 4,
    "special": false,
    "rev": "2e333b4873"
  },
  "봉인파열핵": {
    "elem": "dark",
    "shape": "core",
    "tier": 4,
    "special": false,
    "rev": "4da01ff36e"
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
    "rev": "98c4e22d35"
  },
  "원초의 파편": {
    "elem": "dark",
    "shape": "core",
    "tier": 6,
    "special": false,
    "rev": "6d034cf7fa"
  },
  "심연 열쇠지기": {
    "elem": "dark",
    "shape": "humanoid",
    "tier": 6,
    "special": false,
    "rev": "7ae4af9d79"
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
    "rev": "28844a3576"
  },
  "원초 감시자": {
    "elem": "dark",
    "shape": "eye",
    "tier": 7,
    "special": false,
    "rev": "99401bc7e9"
  },
  "심연의 파편룡": {
    "elem": "dark",
    "shape": "dragon",
    "tier": 7,
    "special": false,
    "rev": "b32179ced0"
  },
  "봉인 잔해병": {
    "elem": "holy",
    "shape": "golem",
    "tier": 4,
    "special": false,
    "rev": "0984ec3351"
  },
  "붉은 태양잔해": {
    "elem": "fire",
    "shape": "core",
    "tier": 7,
    "special": false,
    "rev": "4e501d6104"
  },
  "분지 열기쥐": {
    "elem": "fire",
    "shape": "beast",
    "tier": 1,
    "special": false,
    "rev": "4a979b287d"
  },
  "에테르 거품슬라임": {
    "elem": "fire",
    "shape": "slime",
    "tier": 2,
    "special": false,
    "rev": "cbe5a58189"
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
    "rev": "70790b24f3"
  }
};
