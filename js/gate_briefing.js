// 게이트 입장 → 리더 브리핑 → 경로 선택. 확인 전에는 경로를 제안하지 않는다.
{
  const baseMap = UI.renderGateMap;
  UI.renderGateMap = function (...args) {
    const c = this.ctx, run = c && c.run;
    const atEntrance = run && run.floor === 0 && run.map?.pos?.[0] === 0 && run.map?.done?.length === 1;
    if (!c || c.kind !== 'gate' || !atEntrance || run.briefingDone) return baseMap.apply(this, args);
    if (this._gateBriefing === run) return;
    if (this.dlg) {
      const d = this.dlg, done = d.onDone;
      if (d._gateBriefingRun !== run) {
        d._gateBriefingRun = run;
        d.onDone = (...a) => {
          if (done) done(...a);
          if (this.ctx === c && !run.briefingDone) this.renderGateMap(...args);
        };
      }
      return;
    }
    this._gateBriefing = run;
    const L = this.councilLeader ? this.councilLeader() : null;
    const rank = RANKS[c.gate.tier].key;
    const info = `${rank}급 게이트, 총 ${run.floors}층`;
    const register = L && G.personaRegister ? G.personaRegister(L) : 'banmal';
    const speech = {
      haera: [`${info}이다. 각 층 끝의 보스를 쓰러뜨리고, 마지막 층 보스까지 잡으면 공략이 끝난다.`, '앞에서 확인한 정보만 믿고 움직여라. 아직 확인하지 않은 지점은 들어가 봐야 무엇이 있는지 알 수 있다.', '체력과 정신력은 다음 전투에도 이어진다. 휴식 지점에서 상태를 추스르고, 갈림길에서는 의견을 듣고 길을 정하겠다.'],
      banmal: [`${info}야. 층마다 끝에 있는 보스를 잡고, 마지막 층 보스까지 쓰러뜨리면 돼.`, '아직 확인하지 않은 지점은 뭐가 있을지 몰라. 보이는 정보를 보고 움직이자.', '체력과 정신력은 전투가 끝나도 그대로야. 휴식 지점에서 회복하고, 갈림길에선 의견을 듣고 길을 정할게.'],
      short: [`${info}. 층 끝의 보스를 잡는다. 마지막 층 보스까지 잡으면 끝.`, '미확인 지점은 들어가야 안다. 보이는 정보부터 확인한다.', '체력과 정신력은 계속 소모된다. 휴식 지점에서 회복. 갈림길에선 의견을 듣겠다.'],
      haeyo: [`${info}예요. 각 층 끝의 보스를 잡고, 마지막 층 보스까지 쓰러뜨리면 공략이 끝나요.`, '미확인 지점은 들어가 보기 전에는 무엇이 있는지 몰라요. 확인된 정보를 보면서 움직여요.', '체력과 정신력은 다음 전투에도 이어져요. 휴식 지점에서 회복하고, 갈림길에서는 의견을 듣고 길을 정할게요.'],
      hapsyo: [`${info}입니다. 각 층 끝의 보스를 처치하고, 마지막 층 보스까지 쓰러뜨리면 공략이 완료됩니다.`, '미확인 지점의 내용은 진입 후 알 수 있습니다. 확인된 정보를 바탕으로 이동하겠습니다.', '체력과 정신력은 다음 전투에도 유지됩니다. 휴식 지점에서 회복하고, 갈림길에서는 의견을 듣고 경로를 정하겠습니다.'],
      hao: [`${info}이오. 각 층 끝의 보스를 잡고, 마지막 층 보스까지 쓰러뜨리면 되오.`, '미확인 지점은 들어가 봐야 알 수 있소. 확인된 정보를 보고 움직입시다.', '체력과 정신력은 다음 전투에도 이어지오. 휴식 지점에서 회복하고, 갈림길에서는 의견을 듣고 길을 정하겠소.'],
      hage: [`${info}이네. 각 층 끝의 보스를 잡고, 마지막 층 보스까지 쓰러뜨리면 되네.`, '미확인 지점은 들어가 봐야 알 수 있네. 확인된 정보를 보고 움직이세.', '체력과 정신력은 다음 전투에도 이어지네. 휴식 지점에서 회복하고, 갈림길에서는 의견을 듣고 길을 정하겠네.'],
    };
    const lines = L ? (speech[register] || speech.banmal).map(text => ({ who: L, text })) : [
      { narr: `${info}에 들어왔다. 각 층 끝의 보스를 쓰러뜨리고 마지막 층 보스까지 처치하면 공략이 끝난다.` },
      { who: 'player', text: G.party().length ? '확인된 정보부터 보자. 체력과 정신력은 다음 전투에도 이어지니까 휴식 지점도 살펴야겠어. 갈림길에서는 다 같이 상의하자.' : '확인된 정보를 보고 길을 정하자. 체력과 정신력은 다음 전투에도 이어지니까 휴식 지점도 살펴야겠어.' },
    ];
    const finish = () => {
      if (this.ctx !== c || this._gateBriefing !== run) return;
      run.briefingDone = true;
      this._gateBriefing = null;
      this.renderGateMap(...args);
    };
    this.modal('<div class="eyebrow">게이트 입장</div><h3>공략 브리핑</h3>', 'event-box');
    lines.push({ choices: [{ text: '브리핑 확인', go: finish }] });
    return this.talk(lines, finish);
  };
}
