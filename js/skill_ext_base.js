// ===== 게이트 크로니클: 직업 스킬 확장 데이터 그릇 (영역 A, 사용자 확정 기획) =====
// 직업당 18개 = 등급 액티브 8(기존 F·D·A 3 + 새 E·C·B·S·SS 5) + 빛의 깨달음 2 + 어둠의 깨달음 2
//              + 직업 패시브 4(F·C·A·S) + 빛의 패시브 1 + 어둠의 패시브 1
// 데이터는 js/skill_ext_*.js 가 SKILL_EXT.push(...) 하고, js/skill_ext.js 가 SKILLS 에 등록·습득 규칙·패시브 효과를 붙인다.
//  액티브 항목: [이름, 종류, 위력, 정신력, 설명, 속성 또는 null, { trig, hpCost }]
//  패시브 항목: [이름, { 효과 }, 설명]
//  { cls, rank: [E, C, B, S, SS], light: [2], dark: [2], passive: [F, C, A, S], lightP, darkP }
const SKILL_EXT = [];
