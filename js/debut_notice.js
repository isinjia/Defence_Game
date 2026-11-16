// 신입 등록 안내는 진로 선택·보상 없이 한 번 확인하고 닫는다.
{
  const baseChoice = UI.storyChoice;
  UI.storyChoice = function (i) {
    const current = this.curStory;
    if (current?.ev.id !== 'debut_normal_0') return baseChoice.call(this, i);
    if (i !== 0) return;
    current.ev.choices[0].do(G, current.c);
    this.curStory = null;
    G.recalc();
    G.save();
    this.renderGame();
    this.closeModal();
    this.processQueue();
  };
}
