// ===== 게이트 크로니클: 절차적 그래픽 =====
// 외부 이미지 없이 SVG·캔버스로 초상화, 괴수, 지도, 연출을 그린다.

const FX = {
  hash(str) {
    let h = 2166136261;
    for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },
  rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  },
  uid() { return 'g' + Math.random().toString(36).slice(2, 9); },
  reduced: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,

  PAL: {
    fire: { dark: '#2a0f0b', mid: '#7a2a16', hi: '#ff7a45' },
    bolt: { dark: '#24200a', mid: '#6b5a12', hi: '#ffd84d' },
    ice: { dark: '#0a2230', mid: '#1d5a78', hi: '#6fd3ff' },
    steel: { dark: '#1b1f26', mid: '#4a5361', hi: '#c9d2de' },
    spirit: { dark: '#1c0f2e', mid: '#4e2a7a', hi: '#c58cff' },
    none: { dark: '#1b1f26', mid: '#3a4250', hi: '#9aa6b8' },
  },

  // ---------- 아이콘 ----------
  elemIcon(e, size = 14) {
    const c = e ? ELEMENTS[e].color : '#9aa6b8';
    const s = `width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" class="ico"`;
    switch (e) {
      case 'fire': return `<svg ${s}><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="${c}"/></svg>`;
      case 'bolt': return `<svg ${s}><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="${c}"/></svg>`;
      case 'ice': return `<svg ${s}><g stroke="${c}" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="M9 3.5 12 6l3-2.5M9 20.5 12 18l3 2.5" fill="none"/></g></svg>`;
      case 'steel': return `<svg ${s}><path d="M10 2h4l.6 2.6 2.3 1 2.3-1.4 2.8 2.8-1.4 2.3 1 2.3L24 12v0l-2.6.6-1 2.3 1.4 2.3-2.8 2.8-2.3-1.4-2.3 1L14 22h-4l-.6-2.6-2.3-1-2.3 1.4-2.8-2.8 1.4-2.3-1-2.3L0 12l2.6-.6 1-2.3-1.4-2.3 2.8-2.8 2.3 1.4 2.3-1z" fill="${c}"/><circle cx="12" cy="12" r="3.6" fill="#11151d"/></svg>`;
      case 'spirit': return `<svg ${s}><ellipse cx="12" cy="12" rx="10" ry="6.5" fill="none" stroke="${c}" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="${c}"/></svg>`;
      default: return `<svg ${s}><circle cx="12" cy="12" r="5" fill="${c}"/></svg>`;
    }
  },
  icon(name, size = 15) {
    const s = `width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" class="ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    const P = {
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
      pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
      hourglass: '<path d="M6 2h12M6 22h12M7 2c0 6 10 6 10 10S7 16 7 22M17 2c0 6-10 6-10 10s10 4 10 10"/>',
      coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
      star: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z"/>',
      train: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v6M6 21l3-7h6l3 7M7 11h10"/>',
      rest: '<path d="M21 13a8 8 0 1 1-9.5-9.8A6.5 6.5 0 0 0 21 13z"/>',
      gate: '<ellipse cx="12" cy="12" rx="6" ry="9"/><ellipse cx="12" cy="12" rx="2.5" ry="5"/>',
    };
    return `<svg ${s}>${P[name] || ''}</svg>`;
  },

  // ---------- 인물 초상화 ----------
  avatar(seed, gender, element, rankIdx, size = 56) {
    const r = this.rng(this.hash(seed));
    const pick = (a) => a[Math.floor(r() * a.length)];
    const pal = this.PAL[element] || this.PAL.none;
    const id = this.uid();
    const skin = pick(['#f1d3bc', '#e8c3a3', '#d6a77f', '#b88560']);
    const hair = pick(['#16161d', '#2b211c', '#4a3324', '#7a5a3a', '#b9b3c9', '#24365e', '#5e2430', pal.hi]);
    const jacket = pick(['#1a2030', '#23202c', '#14242a', '#2a1f1a']);
    const style = Math.floor(r() * 4);
    const acc = Math.floor(r() * 5);
    const long = gender === 'F' ? r() < 0.75 : r() < 0.12;
    const ring = rankIdx != null ? RANKS[rankIdx].color : pal.hi;
    let back = '';
    if (long) back = `<path d="M18 28C16 12 48 12 46 28L49 50C43 47 21 47 15 50Z" fill="${hair}"/>`;
    const fringes = [
      `<path d="M20 28C19 15 27 12 32 12C39 12 45 16 44 28C42 21 37 18 31 19C26 19 22 22 20 28Z" fill="${hair}"/>`,
      `<path d="M19 29 21 15 25 19 27 11 31 17 34 10 37 17 41 12 42 19 45 16 44 29C40 22 36 20 32 20S23 22 19 29Z" fill="${hair}"/>`,
      `<path d="M20 30C18 16 26 12 33 12C41 12 46 17 44 26C38 24 32 19 30 15C28 21 24 25 20 30Z" fill="${hair}"/>`,
      `<path d="M20 27C20 16 26 12 32 12S44 16 44 27C41 23 36 22 32 22S23 23 20 27Z" fill="${hair}"/><circle cx="32" cy="10" r="4.5" fill="${hair}"/>`,
    ];
    let accSvg = '';
    if (acc === 1) accSvg = `<rect x="22" y="26" width="20" height="5" rx="2.5" fill="${pal.hi}" opacity=".85"/><rect x="22" y="26" width="20" height="5" rx="2.5" fill="url(#${id}v)"/>`;
    else if (acc === 2) accSvg = `<path d="M37 31 41 37" stroke="#8a3a3a" stroke-width="1.4" stroke-linecap="round"/>`;
    else if (acc === 3) accSvg = `<circle cx="21" cy="30" r="2.2" fill="${pal.hi}"/><path d="M21 32 25 37" stroke="${pal.hi}" stroke-width="1"/>`;
    const eyes = acc === 1 ? '' : `<ellipse cx="27.5" cy="29" rx="1.6" ry="1.9" fill="#1a1a22"/><ellipse cx="36.5" cy="29" rx="1.6" ry="1.9" fill="#1a1a22"/><path d="M25 25.5h5M34 25.5h5" stroke="${hair}" stroke-width="1.3" stroke-linecap="round"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="avatar" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="초상화">
      <defs><radialGradient id="${id}b" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="${pal.mid}"/><stop offset="1" stop-color="${pal.dark}"/></radialGradient>
      <linearGradient id="${id}v" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}c"><circle cx="32" cy="32" r="30"/></clipPath></defs>
      <circle cx="32" cy="32" r="31" fill="url(#${id}b)"/>
      <g clip-path="url(#${id}c)">
        ${back}
        <path d="M6 66C8 51 19 45 32 45S56 51 58 66Z" fill="${jacket}"/>
        <path d="M24 46 32 55 40 46" fill="none" stroke="${pal.hi}" stroke-width="1.6" opacity=".9"/>
        <rect x="28" y="37" width="8" height="9" rx="2" fill="${skin}"/>
        <ellipse cx="32" cy="28" rx="11" ry="12.5" fill="${skin}"/>
        ${eyes}<path d="M30 35.5q2 1.2 4 0" stroke="#7a4a3a" stroke-width="1" fill="none" stroke-linecap="round"/>
        ${fringes[style]}${accSvg}
      </g>
      <circle cx="32" cy="32" r="30.5" fill="none" stroke="${ring}" stroke-width="2"/>
    </svg>`;
  },

  // ---------- 괴수 스프라이트 ----------
  monster(mon, size = 110) {
    const shape = mon.shape || 'slime';
    const pal = this.PAL[mon.elem] || this.PAL.none;
    const id = this.uid();
    const r = this.rng(this.hash(mon.name));
    const body = `url(#${id}g)`;
    const hi = pal.hi;
    const eye = (x, y, rr = 3) => `<circle cx="${x}" cy="${y}" r="${rr * 1.9}" fill="${hi}" opacity=".35"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${hi}"/><circle cx="${x}" cy="${y}" r="${rr * 0.45}" fill="#fff"/>`;
    let g = '';
    switch (shape) {
      case 'beast':
        g = `<path d="M12 50 21 37 26 44 34 41C46 38 62 38 72 43 82 47 87 54 89 61L96 56 93 66 87 67C85 73 81 75 77 75L77 88H70L68 75H46L44 88H37L36 73C31 71 27 67 25 61H15C10 59 8 53 12 50Z" fill="${body}"/>
          <path d="M38 40 42 31 46 39M50 38 55 28 59 38M62 40 68 31 70 42" fill="${hi}" opacity=".9"/>
          ${eye(20, 49, 2.6)}<path d="M13 57h9" stroke="${hi}" stroke-width="1.5"/>`;
        break;
      case 'slime':
        g = `<path d="M14 82C8 60 24 28 50 26 76 28 92 60 86 82 70 90 30 90 14 82Z" fill="${body}"/>
          <ellipse cx="38" cy="42" rx="10" ry="6" fill="#fff" opacity=".18" transform="rotate(-25 38 42)"/>
          <path d="M26 84v6M60 86v7M74 83v5" stroke="${hi}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
          ${eye(40, 58, 4.5)}${eye(60, 58, 4.5)}<path d="M42 70q8 6 16 0" stroke="${pal.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
        break;
      case 'swarm': {
        let bugs = '';
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const x = 18 + r() * 64, y = 22 + r() * 56; pts.push([x, y]);
          bugs += `<g transform="translate(${x} ${y}) rotate(${r() * 60 - 30})"><ellipse cx="-5" cy="-4" rx="6" ry="3" fill="#fff" opacity=".35"/><ellipse cx="5" cy="-4" rx="6" ry="3" fill="#fff" opacity=".35"/><ellipse rx="4" ry="6" fill="${body}"/><circle cy="-4" r="1.6" fill="${hi}"/></g>`;
        }
        const lines = pts.slice(1).map((p, i) => `<path d="M${pts[i][0]} ${pts[i][1]} L${(pts[i][0] + p[0]) / 2 + 4} ${(pts[i][1] + p[1]) / 2 - 3} L${p[0]} ${p[1]}" stroke="${hi}" stroke-width="1" fill="none" opacity=".55"/>`).join('');
        g = lines + bugs;
        break;
      }
      case 'drone':
        g = `<path d="M18 46 6 40 10 54ZM82 46 94 40 90 54Z" fill="${pal.mid}"/>
          <circle cx="50" cy="48" r="26" fill="${body}"/><circle cx="50" cy="48" r="26" fill="none" stroke="${hi}" stroke-width="2" stroke-dasharray="6 5" opacity=".8"/>
          <circle cx="50" cy="48" r="13" fill="${pal.dark}"/>${eye(50, 48, 6)}
          <path d="M38 72q-4 10 2 18M50 74v18M62 72q4 10-2 18" stroke="${hi}" stroke-width="2" fill="none" opacity=".7"/>`;
        break;
      case 'golem':
        g = `<rect x="36" y="14" width="28" height="22" rx="3" fill="${body}"/><rect x="41" y="23" width="18" height="4" fill="${hi}"/>
          <path d="M28 38H72L78 70H22Z" fill="${body}"/>
          <rect x="10" y="38" width="15" height="40" rx="4" fill="${body}"/><rect x="75" y="38" width="15" height="40" rx="4" fill="${body}"/>
          <rect x="30" y="70" width="15" height="22" rx="2" fill="${body}"/><rect x="55" y="70" width="15" height="22" rx="2" fill="${body}"/>
          <path d="M44 42 50 52 46 60M58 46 54 56" stroke="${hi}" stroke-width="2" fill="none"/><circle cx="50" cy="52" r="5" fill="${hi}" opacity=".8"/>`;
        break;
      case 'ghost':
        g = `<path d="M50 12C34 12 27 28 27 44L23 88 31 80 37 90 44 80 50 90 56 80 63 90 69 80 77 88 73 44C73 28 66 12 50 12Z" fill="${body}" opacity=".95"/>
          <path d="M37 22C40 15 60 15 63 22 60 18 40 18 37 22Z" fill="#fff" opacity=".2"/>
          <ellipse cx="50" cy="40" rx="12" ry="14" fill="${pal.dark}"/>${eye(45, 40, 2.6)}${eye(55, 40, 2.6)}
          <path d="M30 55q-12 6-14 18M70 55q12 6 14 18" stroke="${hi}" stroke-width="2" fill="none" opacity=".6"/>`;
        break;
      case 'choir':
        g = [[28, 0.7], [72, 0.7], [50, 0.95]].map(([cx, sc]) => `<g transform="translate(${cx} ${54 - sc * 8}) scale(${sc}) translate(-50 -50)">
          <path d="M50 12C36 12 30 26 30 42L26 86 34 78 40 88 46 78 50 86 54 78 60 88 66 78 74 86 70 42C70 26 64 12 50 12Z" fill="${body}"/>
          <ellipse cx="50" cy="38" rx="11" ry="12" fill="${pal.dark}"/>${eye(46, 37, 2.2)}${eye(54, 37, 2.2)}<ellipse cx="50" cy="45" rx="3" ry="4" fill="${hi}" opacity=".8"/></g>`).join('');
        break;
      case 'spider': {
        let legs = '';
        for (let i = 0; i < 4; i++) {
          const y = 46 + i * 7;
          legs += `<path d="M42 ${y} L${22 - i * 3} ${y - 16 + i * 2} L${8 + i * 2} ${y + 14 + i * 4}" stroke="${pal.mid}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>`;
          legs += `<path d="M58 ${y} L${78 + i * 3} ${y - 16 + i * 2} L${92 - i * 2} ${y + 14 + i * 4}" stroke="${pal.mid}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>`;
        }
        g = `${legs}<ellipse cx="50" cy="66" rx="20" ry="18" fill="${body}"/><path d="M42 60h16M44 68h12M46 76h8" stroke="${hi}" stroke-width="2"/>
          <ellipse cx="50" cy="44" rx="12" ry="10" fill="${body}"/>${eye(45, 42, 2)}${eye(55, 42, 2)}${eye(50, 38, 1.6)}<path d="M34 34 42 26 46 33M66 34 58 26 54 33" fill="${hi}"/>`;
        break;
      }
      case 'flyer':
        g = `<path d="M50 48 8 20 20 50 4 58 34 58ZM50 48 92 20 80 50 96 58 66 58Z" fill="${pal.mid}" opacity=".9"/>
          <path d="M50 48 8 20M50 48 92 20" stroke="${hi}" stroke-width="1.5"/>
          <path d="M50 26 60 50 50 88 40 50Z" fill="${body}"/>${eye(50, 38, 3)}
          <path d="M44 62 30 80M56 62 70 80" stroke="${hi}" stroke-width="2.5" stroke-linecap="round"/><path d="M50 70 L46 96 50 90 54 96Z" fill="${hi}"/>`;
        break;
      case 'dragon':
        g = `<path d="M54 50C60 30 72 14 92 8 84 22 86 30 96 38 82 40 76 50 72 58Z" fill="${pal.mid}" opacity=".95"/>
          <path d="M50 52C40 34 28 22 10 18 18 30 14 38 6 46 20 46 30 52 36 60Z" fill="${pal.mid}" opacity=".8"/>
          <path d="M36 62C38 50 52 46 64 52 74 58 78 70 90 74 96 76 98 84 94 90 88 82 76 84 66 80 54 84 40 78 36 62Z" fill="${body}"/>
          <path d="M42 58C36 46 30 38 20 36 14 35 8 38 6 44L14 46 10 52C16 52 22 50 26 52 30 56 32 62 34 66Z" fill="${body}"/>
          <path d="M14 36 12 28 18 34M22 35 24 27 26 36" fill="${hi}"/>${eye(15, 42, 2.2)}
          <path d="M44 66h18M48 72h14" stroke="${hi}" stroke-width="1.5" opacity=".8"/><path d="M6 46 0 50" stroke="${hi}" stroke-width="2"/>`;
        break;
      case 'eye': {
        let tent = '';
        for (let i = 0; i < 6; i++) { const x = 26 + i * 10; tent += `<path d="M${x} 66 Q${x + (r() * 16 - 8)} 80 ${x + (r() * 20 - 10)} 96" stroke="${pal.mid}" stroke-width="5" fill="none" stroke-linecap="round"/>`; }
        g = `${tent}<circle cx="50" cy="46" r="30" fill="${body}"/><circle cx="50" cy="46" r="20" fill="#e8e2f0"/>
          <circle cx="50" cy="46" r="13" fill="${hi}"/><ellipse cx="50" cy="46" rx="3.5" ry="11" fill="#0a0a10"/><circle cx="44" cy="40" r="3" fill="#fff" opacity=".8"/>
          <path d="M20 46q30-34 60 0" stroke="${pal.dark}" stroke-width="4" fill="none"/>`;
        break;
      }
      case 'core': {
        let rays = '';
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const x1 = 50 + Math.cos(a) * 28, y1 = 50 + Math.sin(a) * 28, x2 = 50 + Math.cos(a) * (40 + r() * 8), y2 = 50 + Math.sin(a) * (40 + r() * 8); rays += `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${hi}" stroke-width="${2 + r() * 3}" stroke-linecap="round"/>`; }
        g = `${rays}<circle cx="50" cy="50" r="28" fill="${body}"/><circle cx="50" cy="50" r="16" fill="${hi}" opacity=".9"/><circle cx="50" cy="50" r="8" fill="#fff"/>
          <path d="M30 40q8-6 14 0M56 40q8-6 14 0" stroke="${pal.dark}" stroke-width="3" fill="none"/>`;
        break;
      }
      case 'lord': {
        let tent = '';
        for (let i = 0; i < 9; i++) { const x = 14 + i * 9; tent += `<path d="M${x} 62 Q${x + (r() * 24 - 12)} 82 ${x + (r() * 24 - 12)} 99" stroke="${pal.mid}" stroke-width="6" fill="none" stroke-linecap="round"/>`; }
        g = `<circle cx="50" cy="44" r="44" fill="${hi}" opacity=".12"/>${tent}
          <path d="M14 66C14 34 30 18 50 18S86 34 86 66Z" fill="${body}"/>
          <path d="M28 22 34 6 40 18 50 2 60 18 66 6 72 22Z" fill="${hi}"/>
          <circle cx="50" cy="44" r="16" fill="#e8e2f0"/><circle cx="50" cy="44" r="10" fill="${hi}"/><ellipse cx="50" cy="44" rx="3" ry="9" fill="#0a0a10"/>
          ${eye(28, 52, 3)}${eye(72, 52, 3)}${eye(36, 34, 2)}${eye(64, 34, 2)}`;
        break;
      }
    }
    return `<svg class="mon-svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${mon.name}">
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.mid}"/><stop offset="1" stop-color="${pal.dark}"/></linearGradient></defs>
      <ellipse cx="50" cy="96" rx="30" ry="4" fill="#000" opacity=".45"/>${g}</svg>`;
  },

  // ---------- 사건 삽화 ----------
  eventArt(id) {
    const scenes = {
      injured_hunter: ['#3a1520', '<path d="M20 70h60" stroke="#ff6b6b" stroke-width="2"/><ellipse cx="50" cy="64" rx="22" ry="6" fill="#0a0d14"/><circle cx="30" cy="60" r="6" fill="#c9a28a"/><path d="M36 60h28l6 4H36z" fill="#2a3245"/><path d="M74 28h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="#ff6b6b"/>'],
      black_market: ['#1d1430', '<path d="M30 80V44c0-12 8-20 18-20s18 8 18 20v36z" fill="#0a0d14"/><circle cx="48" cy="44" r="8" fill="#140f20"/><circle cx="45" cy="44" r="1.6" fill="#c58cff"/><circle cx="51" cy="44" r="1.6" fill="#c58cff"/><path d="M68 62l6-10 6 10-6 10z" fill="#c58cff"/><circle cx="74" cy="62" r="12" fill="#c58cff" opacity=".2"/>'],
      kid_lost: ['#2a1d10', '<rect x="16" y="20" width="8" height="8" rx="2" fill="#ff4f6a"/><circle cx="20" cy="24" r="14" fill="#ff4f6a" opacity=".2"/><circle cx="52" cy="50" r="6" fill="#e8c3a3"/><path d="M45 58h14l2 18H43z" fill="#f0b35b"/><path d="M47 76v8M57 76v8" stroke="#2a3245" stroke-width="3"/>'],
      ruins: ['#10202a', '<path d="M18 84V40h10v44M40 84V52h10v32M64 84V34h10v12l-4 4 4 4v30" fill="#2a3245"/><path d="M14 84h76" stroke="#3a4560" stroke-width="3"/><ellipse cx="52" cy="80" rx="18" ry="5" fill="#6fd3ff" opacity=".5"/><circle cx="52" cy="72" r="10" fill="#6fd3ff" opacity=".2"/>'],
      duel_challenge: ['#2a1414', '<path d="M24 76 70 30M30 82l-10-10M76 24l6-6" stroke="#c9d2de" stroke-width="4" stroke-linecap="round"/><path d="M76 76 30 30M70 82l10-10M24 24l-6-6" stroke="#ff7a45" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="53" r="6" fill="#fff" opacity=".7"/>'],
      mentor: ['#14202a', '<circle cx="50" cy="40" r="22" fill="#4fd1e8" opacity=".12"/><circle cx="50" cy="36" r="7" fill="#d6a77f"/><path d="M44 30q6-6 12 0" stroke="#e8e8f0" stroke-width="3" fill="none"/><path d="M40 46h20l4 32H36z" fill="#2a3245"/><path d="M68 44v40" stroke="#8a6a4a" stroke-width="3"/>'],
      gate_surge: ['#160f2a', '<ellipse cx="50" cy="52" rx="20" ry="30" fill="none" stroke="#c58cff" stroke-width="3"/><ellipse cx="50" cy="52" rx="10" ry="18" fill="#c58cff" opacity=".45"/><path d="M20 30q10 10 4 22M80 28q-8 12-2 24M30 82q10-6 20 0" stroke="#4fd1e8" stroke-width="2" fill="none"/>'],
      reporter: ['#1a1d10', '<rect x="22" y="40" width="34" height="24" rx="3" fill="#2a3245"/><circle cx="39" cy="52" r="8" fill="#0a0d14" stroke="#c9d2de" stroke-width="2"/><rect x="56" y="46" width="10" height="12" fill="#2a3245"/><circle cx="74" cy="36" r="5" fill="#ff4f6a"/><path d="M74 41v30" stroke="#c9d2de" stroke-width="3"/>'],
    };
    const [bg, art] = scenes[id] || ['#14202a', ''];
    return `<svg class="event-art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="사건 삽화" style="background:radial-gradient(circle at 50% 40%, ${bg}, #0a0d14 75%)">${art}</svg>`;
  },

  // ---------- 타이틀 캔버스: 균열 포털과 도시 ----------
  title(canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, buildings = [], parts = [], raf = 0, t = 0;
    const r = this.rng(2087);
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildings = []; let x = -10;
      while (x < w + 10) { const bw = 18 + r() * 46; const bh = h * (0.08 + r() * 0.22); buildings.push({ x, bw, bh, win: Array.from({ length: 30 }, () => r() < 0.28) }); x += bw + 2; }
    };
    const spawn = () => ({ a: r() * Math.PI * 2, d: 40 + r() * Math.max(w, h) * 0.6, s: 0.4 + r() * 1.4, c: r() < 0.7 ? '79,209,232' : '197,140,255', z: r() });
    resize();
    for (let i = 0; i < 160; i++) parts.push(spawn());
    const draw = () => {
      t += 0.008;
      const cx = w / 2, cy = h * 0.4;
      ctx.fillStyle = '#07090f'; ctx.fillRect(0, 0, w, h);
      const sky = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.7);
      sky.addColorStop(0, 'rgba(120,70,200,.35)'); sky.addColorStop(0.4, 'rgba(30,60,110,.18)'); sky.addColorStop(1, 'rgba(7,9,15,0)');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      // 포털 고리
      const R = Math.min(w, h) * 0.18;
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (i % 2 ? -1 : 1) * (0.4 + i * 0.15));
        ctx.scale(1, 1.45);
        ctx.strokeStyle = i % 2 ? 'rgba(197,140,255,.55)' : 'rgba(79,209,232,.5)';
        ctx.lineWidth = 1.5 + (4 - i) * 0.6; ctx.setLineDash([R * 0.4, R * 0.18 + i * 6]);
        ctx.beginPath(); ctx.arc(0, 0, R * (0.55 + i * 0.16), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.75);
      core.addColorStop(0, 'rgba(255,255,255,.9)'); core.addColorStop(0.25, 'rgba(197,140,255,.65)'); core.addColorStop(1, 'rgba(79,209,232,0)');
      ctx.save(); ctx.translate(cx, cy); ctx.scale(0.62, 1); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, R * 0.75, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // 빨려드는 입자
      for (const p of parts) {
        p.d -= p.s * (1 + (1 - p.d / (Math.max(w, h) * 0.6)) * 2); p.a += 0.004 + 0.02 * (60 / Math.max(60, p.d));
        if (p.d < 8) Object.assign(p, spawn());
        const x = cx + Math.cos(p.a) * p.d, y = cy + Math.sin(p.a) * p.d * 1.2;
        ctx.fillStyle = `rgba(${p.c},${0.25 + p.z * 0.6})`; ctx.fillRect(x, y, 1.2 + p.z * 1.6, 1.2 + p.z * 1.6);
      }
      // 도시 실루엣
      for (const b of buildings) {
        const by = h - b.bh;
        ctx.fillStyle = '#0b0f18'; ctx.fillRect(b.x, by, b.bw, b.bh);
        ctx.fillStyle = 'rgba(79,209,232,.08)'; ctx.fillRect(b.x, by, b.bw, 2);
        let k = 0;
        for (let yy = by + 8; yy < h - 6; yy += 9) for (let xx = b.x + 5; xx < b.x + b.bw - 5; xx += 8) {
          if (b.win[k++ % 30]) { ctx.fillStyle = (k * 7) % 11 === 0 ? 'rgba(255,181,71,.55)' : 'rgba(150,200,255,.22)'; ctx.fillRect(xx, yy, 3, 4); }
        }
      }
      const fog = ctx.createLinearGradient(0, h * 0.7, 0, h); fog.addColorStop(0, 'rgba(7,9,15,0)'); fog.addColorStop(1, 'rgba(7,9,15,.85)');
      ctx.fillStyle = fog; ctx.fillRect(0, h * 0.7, w, h * 0.3);
      if (!FX.reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  },

  // ---------- 돌파 연출 ----------
  breakthrough(ok, rankIdx, done) {
    const R = RANKS[rankIdx];
    const el = document.createElement('div');
    el.className = 'bt-overlay ' + (ok ? 'ok' : 'fail');
    el.style.setProperty('--rc', ok ? R.color : '#ff4f6a');
    el.innerHTML = `<div class="bt-ring"></div><div class="bt-ring r2"></div><div class="bt-ring r3"></div>
      <div class="bt-letter">${ok ? R.key : '✕'}</div><div class="bt-cap">${ok ? `${R.name} 각성` : '역류'}</div>`;
    document.body.appendChild(el);
    const end = () => { el.remove(); done(); };
    setTimeout(end, FX.reduced ? 300 : 2100);
  },

  // ---------- 전투 효과 ----------
  floatText(host, text, cls) {
    const f = document.createElement('div');
    f.className = 'float-num ' + (cls || '');
    f.textContent = text;
    host.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  },
  burst(host, color, n = 10) {
    if (FX.reduced) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'spark';
      const a = Math.random() * Math.PI * 2, d = 24 + Math.random() * 36;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', Math.sin(a) * d + 'px');
      p.style.background = color;
      host.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  },
  pulse(el, cls, ms = 450) {
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  },
};
