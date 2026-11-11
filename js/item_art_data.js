// 아이템 아이콘 연결 정보. 표시 파일을 다시 만들 때 함께 갱신한다.
const ITEM_ART_DATA = {
  "cons_potion": {
    "kind": "cons",
    "key": "potion",
    "name": "응급 회복제",
    "rev": "45419c4bbc"
  },
  "cons_mana": {
    "kind": "cons",
    "key": "mana",
    "name": "마나 앰플",
    "rev": "33a436361e"
  },
  "cons_crystal": {
    "kind": "cons",
    "key": "crystal",
    "name": "에테르 결정",
    "rev": "375bb9ea6f"
  },
  "cons_elixir": {
    "kind": "cons",
    "key": "elixir",
    "name": "각성 촉진제",
    "rev": "f42a807ac7"
  },
  "cons_antidote": {
    "kind": "cons",
    "key": "antidote",
    "name": "해독제",
    "rev": "5d348ff1d6"
  },
  "cons_amp": {
    "kind": "cons",
    "key": "amp",
    "name": "강화 앰플",
    "rev": "c465b7e764"
  },
  "cons_flash": {
    "kind": "cons",
    "key": "flash",
    "name": "섬광탄",
    "rev": "28506a2a40"
  },
  "cons_recall": {
    "kind": "cons",
    "key": "recall",
    "name": "귀환석",
    "rev": "a25b5b0635"
  },
  "cons_guardcharm": {
    "kind": "cons",
    "key": "guardcharm",
    "name": "결계 부적",
    "rev": "0e32f2acbe"
  },
  "cons_decoy": {
    "kind": "cons",
    "key": "decoy",
    "name": "미끼 드론",
    "rev": "269ea21ec5"
  },
  "part_hide": {
    "kind": "part",
    "key": "hide",
    "name": "괴수 가죽",
    "rev": "181b707756"
  },
  "part_gel": {
    "kind": "part",
    "key": "gel",
    "name": "산성 점액",
    "rev": "544c07141c"
  },
  "part_wing": {
    "kind": "part",
    "key": "wing",
    "name": "날개막",
    "rev": "4a63a3544c"
  },
  "part_circuit": {
    "kind": "part",
    "key": "circuit",
    "name": "에테르 회로",
    "rev": "9142924b23"
  },
  "part_alloy": {
    "kind": "part",
    "key": "alloy",
    "name": "합금 파편",
    "rev": "8327968118"
  },
  "part_ecto": {
    "kind": "part",
    "key": "ecto",
    "name": "망령 실",
    "rev": "8e60c8f940"
  },
  "part_silk": {
    "kind": "part",
    "key": "silk",
    "name": "강철 거미줄",
    "rev": "8fcd10e9f0"
  },
  "part_lens": {
    "kind": "part",
    "key": "lens",
    "name": "수정체",
    "rev": "b3979cb894"
  },
  "part_scale": {
    "kind": "part",
    "key": "scale",
    "name": "용린",
    "rev": "47937b8723"
  },
  "part_sun": {
    "kind": "part",
    "key": "sun",
    "name": "태양핵 조각",
    "rev": "bccc6da5d1"
  },
  "part_bone": {
    "kind": "part",
    "key": "bone",
    "name": "괴수 뼈",
    "rev": "8fa06d6cb6"
  },
  "part_essence": {
    "kind": "part",
    "key": "essence",
    "name": "보스 정수",
    "rev": "89da561bf1"
  },
  "mat_core": {
    "kind": "core",
    "key": "core",
    "name": "괴수 코어",
    "rev": "6807173f12"
  },
  "mat_catalyst": {
    "kind": "cat",
    "key": "catalyst",
    "name": "각성 촉매",
    "rev": "32ed134fc1"
  },
  "relic_magma_heart": {
    "kind": "relic",
    "key": "magma_heart",
    "name": "용암의 심장",
    "rev": "713d415938"
  },
  "relic_storm_quill": {
    "kind": "relic",
    "key": "storm_quill",
    "name": "뇌조의 깃",
    "rev": "44f1e129f0"
  },
  "relic_frost_sarira": {
    "kind": "relic",
    "key": "frost_sarira",
    "name": "빙정 사리",
    "rev": "60e5a6796e"
  },
  "relic_steel_nerve": {
    "kind": "relic",
    "key": "steel_nerve",
    "name": "강철 신경다발",
    "rev": "575c081b83"
  },
  "relic_soul_lamp": {
    "kind": "relic",
    "key": "soul_lamp",
    "name": "혼등",
    "rev": "f0c1d33aea"
  },
  "relic_lucky_coin": {
    "kind": "relic",
    "key": "lucky_coin",
    "name": "대붕괴 이전의 동전",
    "rev": "99ebbec5ed"
  },
  "relic_old_chip": {
    "kind": "relic",
    "key": "old_chip",
    "name": "고대 연산 칩",
    "rev": "e51d190558"
  },
  "relic_world_sap": {
    "kind": "relic",
    "key": "world_sap",
    "name": "세계수 수액",
    "rev": "58fdda699a"
  },
  "relic_rift_shard": {
    "kind": "relic",
    "key": "rift_shard",
    "name": "균열의 파편",
    "rev": "a51ea063a0"
  },
  "relic_dragon_scale": {
    "kind": "relic",
    "key": "dragon_scale",
    "name": "적룡의 비늘",
    "rev": "93d711b486"
  },
  "eq_sword": {
    "kind": "fam",
    "key": "sword",
    "name": "검",
    "rev": "33e337224a"
  },
  "eq_spear": {
    "kind": "fam",
    "key": "spear",
    "name": "창",
    "rev": "1ca90747f0"
  },
  "eq_fist": {
    "kind": "fam",
    "key": "fist",
    "name": "건틀릿",
    "rev": "7a7ec2f8e2"
  },
  "eq_gun": {
    "kind": "fam",
    "key": "gun",
    "name": "총",
    "rev": "2bbb47d407"
  },
  "eq_bow": {
    "kind": "fam",
    "key": "bow",
    "name": "활",
    "rev": "2ee68a0099"
  },
  "eq_dagger": {
    "kind": "fam",
    "key": "dagger",
    "name": "단검",
    "rev": "4f1d4d322d"
  },
  "eq_staff": {
    "kind": "fam",
    "key": "staff",
    "name": "지팡이",
    "rev": "3721d21036"
  },
  "eq_instr": {
    "kind": "fam",
    "key": "instr",
    "name": "악기",
    "rev": "55a1fb3200"
  },
  "eq_shield": {
    "kind": "fam",
    "key": "shield",
    "name": "방패",
    "rev": "88d2251578"
  },
  "eq_drone": {
    "kind": "fam",
    "key": "drone",
    "name": "드론",
    "rev": "ee9a4f1a59"
  },
  "eq_armor": {
    "kind": "slot",
    "key": "armor",
    "name": "방어구",
    "rev": "f3e7da3475"
  },
  "eq_acc": {
    "kind": "slot",
    "key": "acc",
    "name": "장신구",
    "rev": "aa3c5ff61b"
  }
};
