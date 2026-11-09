# 게이트 크로니클 — 세션 공통 안내

바닐라 JS 모바일 웹게임(귀곡팔황식 헌터물 샌드박스, ATB 파티 전투). 여러 구현 세션이 같은 브랜치에서 영역을 나눠 동시에 작업한다.

## 대화
- 사용자에게는 한국어로, 짧고 명확하게 보고한다.
- 항목 하나가 끝날 때마다 무엇을 넣었는지 두세 줄로 보고하고 다음 항목으로 계속한다. 사용자 결정이 필요한 경우에만 멈춘다.

## 먼저 읽을 것
- `docs/구현_대기목록.md`: 작업 분담표. **"0. 모든 세션 공통 규칙"을 반드시 지킨다.** 자기 영역의 항목을 순서대로 구현하고, 설계는 괄호 속 `docs/` 문서를 읽는다.
- `docs/병렬_개발_품질.md`: 연기 시험·보고 규칙.

## 꼭 지킬 것 (자세한 내용은 공통 규칙)
- 브랜치 `claude/happy-turing-czlfa3`에만 올린다.
- `dist/`는 커밋하지 않는다(배포 때 GitHub Actions가 빌드). 커밋 전에 `git diff --cached --name-only | grep '^dist/'`로 확인.
- 새 시스템은 `js/` 아래 새 파일 + `tools/build.sh`의 `SRC`에 추가. 기존 함수는 감싸기(wrap)로 확장하고, 남의 코드는 되돌리지 않는다.
- 옛 저장 호환: 새 필드는 `initSandbox` 감싸기에서 `??=`로 채운다.
- 항목마다: `bash tools/build.sh && node tools/smoke_test.js` → `python3 tools/bump_version.py`(0.01씩) → 커밋(`vX.YY: [영역] 내용`) → `git pull --rebase origin claude/happy-turing-czlfa3` → 푸시.
- rebase 충돌: `index.html`·`js/data.js` 버전 줄은 상대 것을 받고 `bump_version.py`를 다시 돌린다. `tools/build.sh` 파일 목록은 양쪽을 모두 남긴다.
- 밸런스에 닿는 변경은 `node tools/balance_sim.js 4 70` 전후 결과를 보고에 남긴다.
- "넣지 않음" 항목은 만들지 않는다.
