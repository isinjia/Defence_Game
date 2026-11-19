// 소속 가입은 계약 조건을 읽고 결정하는 별도 확인창으로 표시한다.
{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  UI.confirmAffiliation=function(id,onOk){
    const name=id==='kama'?'관리국 보호국':GUILDS[id]?.name||'소속 가입';
    const raw=G.payTermsText?G.payTermsText(id):'';
    const source=document.createElement('div');source.innerHTML=raw;
    const parts=source.textContent.split(/\s*·\s*/).map(s=>s.trim()).filter(Boolean);
    const income=parts[0]?.match(/^(.+?):\s*월급\s*(약\s*)?([\d,]+)\s*크레딧\s*\+\s*게이트 전리품 성과급\s*(약\s*)?([\d.]+)%/);
    const category=income?income[1]:id==='kama'?'관리국':'길드';
    const cards=income?`<div class="ao-income"><section><span>월급${income[2]?' · 약':''}</span><strong>${esc(income[3])}<small> 크레딧</small></strong></section><section><span>전리품 성과급${income[4]?' · 약':''}</span><strong>${esc(income[5])}<small>%</small></strong></section></div>`:'';
    const items=income?parts.slice(1):parts;
    const fields=[[/^(선임|신입) 배정/,'공략 지원'],[/^구출/,'구출 확률'],[/^의료 지원/,'의료 지원'],[/^유망주 대우/,'유망주 지원'],[/^훈련비/,'훈련비'],[/^연 1회 장비/,'장비 지원'],[/^공상 보상/,'공상 보상'],[/^매달 공적/,'공적'],[/^유족 보상금/,'유족 보상'],[/^의무 복무/,'의무 복무']];
    const rows=items.map(text=>{const match=fields.find(([re])=>re.test(text));return `<div class="ao-term${/^의무 복무/.test(text)?' ao-duty':''}"><dt>${match?match[1]:'추가 조건'}</dt><dd>${esc(text)}</dd></div>`}).join('');
    // 기존 확인창의 새 누름 판정·취소·가입 콜백은 그대로 사용한다.
    this.confirmOver(`${name} 가입 조건`,'','가입한다',onOk,'primary');
    const overlay=document.getElementById('pl-confirm');if(!overlay)return;
    overlay.classList.add('affiliation-offer');overlay.setAttribute('aria-labelledby','ao-title');
    const box=overlay.querySelector('.plc-box');
    box.innerHTML=`<header class="ao-header"><div class="ao-eyebrow">소속 가입 · 조건 확인</div><span class="ao-category">${esc(category)}</span><h2 id="ao-title">${esc(name)}</h2><div class="ao-intro">가입 전에 급여와 지원 조건을 확인하세요.</div></header><div class="ao-body">${FX.eventArt('guild_contract')}${cards}${rows?`<h3 class="ao-section-title">지원 및 계약 조건</h3><dl class="ao-terms">${rows}</dl>`:''}<div class="ao-notice"><b>가입 후 소속 변경에는 제약이 있습니다.</b><span>조건을 확인한 뒤 결정하세요.</span></div></div><footer class="plc-row ao-actions"><button class="ghost" data-plc="no">취소</button><button class="primary" data-plc="ok">가입한다</button></footer>`;
  };
}
