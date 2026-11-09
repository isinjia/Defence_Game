// ===== NPC 직업을 각성 속성 친화 쪽으로 (4-10, js/class_elem.js rollClassFor) =====
{
  const GP = Game.prototype; const base = GP.makeNpc;
  GP.makeNpc = function (...a) {
    const n = base.apply(this, a);
    if (n && n.race === 'human' && n.element) n.cls = rollClassFor(n.element);
    return n;
  };
}
