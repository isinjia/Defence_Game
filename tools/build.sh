#!/usr/bin/env bash
# 소스 스크립트를 하나로 합치고, 구형 휴대폰 브라우저도 읽을 수 있는 문법(ES2017)으로 변환한다.
# 결과: dist/game.js, dist/style.css  (index.html 은 이 두 파일만 불러온다)
# 사용법: bash tools/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
SRC=(js/data.js js/data_classes.js js/prologue.js js/pro_arcs_a.js js/pro_arcs_b.js js/pro_arcs_c.js js/pro_hooks.js js/game.js js/world.js js/society.js js/story.js js/story_events.js js/story_chains.js js/situation.js js/combat.js js/fx.js assets/portraits/portraits.js js/portrait.js js/mapview.js js/ui.js js/ui_town.js js/merc.js js/crew.js js/gate_explore.js js/ui_prologue.js js/tutorial.js js/hunter.js js/debut.js js/gate_run.js js/formation.js js/ui_mobile.js js/balance.js js/ascend.js js/story_clues.js js/explore.js js/story_calendar.js js/life.js js/gate_eco.js js/travel.js js/news.js js/map_parties.js js/curse.js js/npc_ai.js)
cat "${SRC[@]}" > dist/game.src.js
ESBUILD="npx --yes esbuild@0.24.0"
$ESBUILD dist/game.src.js --target=es2017,chrome61,safari11 --charset=utf8 --log-level=warning --outfile=dist/game.js
cat css/style.css css/ui_b.css > dist/style.src.css
$ESBUILD dist/style.src.css --target=chrome61,safari11 --charset=utf8 --log-level=warning --outfile=dist/style.css
rm dist/game.src.js dist/style.src.css
echo "built dist/game.js ($(wc -c < dist/game.js) bytes), dist/style.css ($(wc -c < dist/style.css) bytes)"
