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
    water: { dark: '#0a1e30', mid: '#1a4f7a', hi: '#4fb3ff' },
    wood: { dark: '#0f2414', mid: '#2a6a34', hi: '#5fcf6a' },
    holy: { dark: '#2a2614', mid: '#7a6a3a', hi: '#fff0b3' },
    dark: { dark: '#1c0f2e', mid: '#4e2a7a', hi: '#a36cff' },
    none: { dark: '#1b1f26', mid: '#3a4250', hi: '#9aa6b8' },
  },

  // ---------- 아이콘 ----------
  elemIcon(e, size = 14) {
    const c = e ? elemColor(e) : '#9aa6b8';
    const s = `width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" class="ico"`;
    switch (e) {
      case 'fire': return `<svg ${s}><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="${c}"/></svg>`;
      case 'bolt': return `<svg ${s}><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="${c}"/></svg>`;
      case 'water': return `<svg ${s}><path d="M12 2.5c3.2 4.6 6.5 8.4 6.5 12a6.5 6.5 0 0 1-13 0c0-3.6 3.3-7.4 6.5-12z" fill="${c}"/><path d="M9 15.5a3 3 0 0 0 3 3" stroke="#11151d" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
      case 'wood': return `<svg ${s}><path d="M20 3C9 3 4 9 4 16c0 1.6.3 3 .8 4.2C6 13 11 9 16 7c-4.6 3-8 7.4-9.6 13.6C7.6 21.5 9.2 22 11 22c6.6 0 10-6 9-19z" fill="${c}"/></svg>`;
      case 'holy': return `<svg ${s}><path d="M12 1.5 14 10l8.5 2-8.5 2-2 8.5-2-8.5-8.5-2L10 10z" fill="${c}"/><circle cx="12" cy="12" r="2.2" fill="#11151d"/></svg>`;
      case 'dark': return `<svg ${s}><path d="M15.5 2.5A9.8 9.8 0 1 0 21.5 17 8 8 0 0 1 15.5 2.5z" fill="${c}"/></svg>`;
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

  // ---------- 인물 초상화 (portrait.js) ----------
  avatar(seed, gender, element, rankIdx, size = 56, opts) { return PORTRAIT.avatar(seed, gender, element, rankIdx, size, opts); },
  portrait(seed, gender, element, rankIdx, w = 200, opts) { return PORTRAIT.card(seed, gender, element, rankIdx, w, opts); },

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

  // ---------- 사건 삽화 (프롤로그·몬스터 원화와 같은 웹툰 화풍 WebP) ----------
  eventArt(id) {
    // 전용 원화. 없으면 분류별 공용 원화(city·field·gate·people·news·night)
    const scenes = {
      aff_guild_bottom: 'aff_guild_bottom', aff_guild_normal: 'aff_guild_normal', aff_guild_rising: 'aff_guild_rising', aff_guild_star: 'aff_guild_star',
      aff_kama: 'aff_kama', aff_kama_bottom: 'aff_kama_bottom', aff_kama_star: 'aff_kama_star', aff_regret: 'aff_regret',
      age_birthday: 'age_birthday', age_classmate: 'age_classmate', age_mortality: 'age_mortality', arrive_news: 'arrive_news',
      arrive_npc_greet: 'arrive_npc_greet', arrive_suspicious: 'arrive_suspicious', arrive_welcome: 'arrive_welcome', baekho_0: 'baekho_0',
      baekho_1: 'baekho_1', baekho_2: 'baekho_2', band_ba_interview: 'band_ba_interview', band_ba_junior: 'band_ba_junior',
      band_ba_politics: 'band_ba_politics', band_ba_tug: 'band_ba_tug', band_dc_contract: 'band_dc_contract', band_dc_first_fan: 'band_dc_first_fan',
      band_dc_jealous: 'band_dc_jealous', band_dc_sponsor: 'band_dc_sponsor', band_fe_night_job: 'band_fe_night_job', band_fe_porter: 'band_fe_porter',
      band_fe_rent: 'band_fe_rent', band_fe_scam_party: 'band_fe_scam_party', band_s_assassin: 'band_s_assassin', band_s_foreign: 'band_s_foreign',
      band_s_heir: 'band_s_heir', band_s_retire_push: 'band_s_retire_push', band_ss_legend: 'band_ss_legend', black_market: 'black_market',
      bond_cold_0: 'bond_cold_0', bond_cold_0_v1: 'bond_cold_0_v1', bond_cold_0_v2: 'bond_cold_0_v2', bond_cold_1: 'bond_cold_1',
      bond_cold_1_v1: 'bond_cold_1_v1', bond_cold_1_v2: 'bond_cold_1_v2', bond_cold_2: 'bond_cold_2', bond_cold_2_v1: 'bond_cold_2_v1',
      bond_cold_2_v2: 'bond_cold_2_v2', bond_cold_3: 'bond_cold_3', bond_cold_3_v1: 'bond_cold_3_v1', bond_cold_3_v2: 'bond_cold_3_v2',
      bond_greedy_0: 'bond_greedy_0', bond_greedy_0_v1: 'bond_greedy_0_v1', bond_greedy_0_v2: 'bond_greedy_0_v2', bond_greedy_1: 'bond_greedy_1',
      bond_greedy_1_v1: 'bond_greedy_1_v1', bond_greedy_1_v2: 'bond_greedy_1_v2', bond_greedy_2: 'bond_greedy_2', bond_greedy_2_v1: 'bond_greedy_2_v1',
      bond_greedy_2_v2: 'bond_greedy_2_v2', bond_greedy_3: 'bond_greedy_3', bond_greedy_3_v1: 'bond_greedy_3_v1', bond_greedy_3_v2: 'bond_greedy_3_v2',
      bond_just_0: 'bond_just_0', bond_just_0_v1: 'bond_just_0_v1', bond_just_0_v2: 'bond_just_0_v2', bond_just_1: 'bond_just_1',
      bond_just_1_v1: 'bond_just_1_v1', bond_just_1_v2: 'bond_just_1_v2', bond_just_2: 'bond_just_2', bond_just_2_v1: 'bond_just_2_v1',
      bond_just_2_v2: 'bond_just_2_v2', bond_just_3: 'bond_just_3', bond_just_3_v1: 'bond_just_3_v1', bond_just_3_v2: 'bond_just_3_v2',
      bond_kind_0: 'bond_kind_0', bond_kind_0_v1: 'bond_kind_0_v1', bond_kind_0_v2: 'bond_kind_0_v2', bond_kind_1: 'bond_kind_1',
      bond_kind_1_v1: 'bond_kind_1_v1', bond_kind_1_v2: 'bond_kind_1_v2', bond_kind_2: 'bond_kind_2', bond_kind_2_v1: 'bond_kind_2_v1',
      bond_kind_2_v2: 'bond_kind_2_v2', bond_kind_3: 'bond_kind_3', bond_kind_3_v1: 'bond_kind_3_v1', bond_kind_3_v2: 'bond_kind_3_v2',
      bond_warlike_0: 'bond_warlike_0', bond_warlike_0_v1: 'bond_warlike_0_v1', bond_warlike_0_v2: 'bond_warlike_0_v2', bond_warlike_1: 'bond_warlike_1',
      bond_warlike_1_v1: 'bond_warlike_1_v1', bond_warlike_1_v2: 'bond_warlike_1_v2', bond_warlike_2: 'bond_warlike_2', bond_warlike_2_v1: 'bond_warlike_2_v1',
      bond_warlike_2_v2: 'bond_warlike_2_v2', bond_warlike_3: 'bond_warlike_3', bond_warlike_3_v1: 'bond_warlike_3_v1', bond_warlike_3_v2: 'bond_warlike_3_v2',
      cal_awaken_day: 'cal_awaken_day', cal_awards: 'cal_awards', cal_cherry: 'cal_cherry', cal_children: 'cal_children',
      cal_chuseok: 'cal_chuseok', cal_daeboreum: 'cal_daeboreum', cal_memorial: 'cal_memorial', cal_monsoon: 'cal_monsoon',
      cal_newcomer: 'cal_newcomer', cal_seollal: 'cal_seollal', cal_summer: 'cal_summer', cal_suneung: 'cal_suneung',
      child_born: 'child_born', city_blackout: 'city_blackout', city_hospital: 'city_hospital', city_scam_guild: 'city_scam_guild',
      civil_audit: 'civil_audit', civil_bribe: 'civil_bribe', civil_promo: 'civil_promo', civil_special_hire: 'civil_special_hire',
      class_advance: 'class_advance', class_advance_retry: 'class_advance_retry', council_quit: 'council_quit', cult_0: 'cult_0',
      cult_1: 'cult_1', cult_2: 'cult_2', cult_3: 'cult_3', debut_bottom_0: 'debut_bottom_0',
      debut_bottom_1: 'debut_bottom_1', debut_bottom_2: 'debut_bottom_2', debut_bottom_3: 'debut_bottom_3', debut_bottom_4: 'debut_bottom_4',
      debut_normal_0: 'debut_normal_0', debut_normal_1: 'debut_normal_1', debut_normal_2: 'debut_normal_2', debut_normal_3: 'debut_normal_3',
      debut_normal_4: 'debut_normal_4', debut_rising_0: 'debut_rising_0', debut_rising_1: 'debut_rising_1', debut_rising_2: 'debut_rising_2',
      debut_rising_3: 'debut_rising_3', debut_rising_4: 'debut_rising_4', debut_star_0: 'debut_star_0', debut_star_1: 'debut_star_1',
      debut_star_2: 'debut_star_2', debut_star_3: 'debut_star_3', debut_star_4: 'debut_star_4', duel_challenge: 'duel_challenge',
      fam_0: 'fam_0', fam_1: 'fam_1', fam_2: 'fam_2', fam_3: 'fam_3',
      field_crashed_truck: 'field_crashed_truck', field_ether_spring: 'field_ether_spring', field_lost_hunter: 'field_lost_hunter', field_monster_nest: 'field_monster_nest',
      field_old_bunker: 'field_old_bunker', field_rain: 'field_rain', field_rival_party: 'field_rival_party', gate_double: 'gate_double',
      gate_loot_fight: 'gate_loot_fight', gate_red: 'gate_red', gate_surge: 'gate_surge', injured_hunter: 'injured_hunter',
      kid_lost: 'kid_lost', media_hearing: 'media_hearing', media_tax: 'media_tax', media_viral: 'media_viral',
      mentor: 'mentor', nb_end: 'nb_end', nb_msg: 'nb_msg', npc_wedding: 'npc_wedding',
      nuri_0: 'nuri_0', nuri_1: 'nuri_1', nuri_2: 'nuri_2', nuri_3: 'nuri_3',
      odd_ether_child: 'odd_ether_child', odd_memory: 'odd_memory', odd_shadow: 'odd_shadow', pocha_0: 'pocha_0',
      pocha_1: 'pocha_1', pocha_2: 'pocha_2', pocha_3: 'pocha_3', race_dwarf_forge: 'race_dwarf_forge',
      race_elf_camp: 'race_elf_camp', race_orc_workers: 'race_orc_workers', rank_a_nation: 'rank_a_nation', rank_b_variety: 'rank_b_variety',
      rank_c_scout: 'rank_c_scout', rank_e_first_party: 'rank_e_first_party', rank_s_offer: 'rank_s_offer', reawaken: 'reawaken',
      reg_busan_market: 'reg_busan_market', reg_daegu_heat: 'reg_daegu_heat', reg_daejeon_lab: 'reg_daejeon_lab', reg_gangbuk_ruins: 'reg_gangbuk_ruins',
      reg_gangnam_party: 'reg_gangnam_party', reg_gangneung_front: 'reg_gangneung_front', reg_gwangju_free: 'reg_gwangju_free', reg_incheon_port: 'reg_incheon_port',
      reg_jeonju_hanok: 'reg_jeonju_hanok', reg_suwon_factory: 'reg_suwon_factory', reg_ulsan_forge: 'reg_ulsan_forge', rel_anniversary: 'rel_anniversary',
      rel_betrayal: 'rel_betrayal', rel_business: 'rel_business', rel_disciple_trouble: 'rel_disciple_trouble', rel_friend_gift: 'rel_friend_gift',
      rel_master_lesson: 'rel_master_lesson', rel_partner_worry: 'rel_partner_worry', rel_rival_challenge: 'rel_rival_challenge', rel_secret: 'rel_secret',
      reporter: 'reporter', rg_busan_fishmarket: 'rg_busan_fishmarket', rg_busan_float: 'rg_busan_float', rg_busan_lighthouse: 'rg_busan_lighthouse',
      rg_daegu_heatwave: 'rg_daegu_heatwave', rg_daegu_market: 'rg_daegu_market', rg_daegu_overflow: 'rg_daegu_overflow', rg_daejeon_ai: 'rg_daejeon_ai',
      rg_daejeon_library: 'rg_daejeon_library', rg_daejeon_subject: 'rg_daejeon_subject', rg_gangbuk_scavenger: 'rg_gangbuk_scavenger', rg_gangbuk_school: 'rg_gangbuk_school',
      rg_gangbuk_squatters: 'rg_gangbuk_squatters', rg_gangnam_academy: 'rg_gangnam_academy', rg_gangnam_dome: 'rg_gangnam_dome', rg_gangnam_gala: 'rg_gangnam_gala',
      rg_gangneung_deserter: 'rg_gangneung_deserter', rg_gangneung_fisher: 'rg_gangneung_fisher', rg_gangneung_watch: 'rg_gangneung_watch', rg_gwangju_assembly: 'rg_gwangju_assembly',
      rg_gwangju_mural: 'rg_gwangju_mural', rg_gwangju_nightmarket: 'rg_gwangju_nightmarket', rg_incheon_customs: 'rg_incheon_customs', rg_incheon_ferry: 'rg_incheon_ferry',
      rg_incheon_hq: 'rg_incheon_hq', rg_jeju_oreum: 'rg_jeju_oreum', rg_jeju_village: 'rg_jeju_village', rg_jeonju_festival: 'rg_jeonju_festival',
      rg_jeonju_hanji: 'rg_jeonju_hanji', rg_jeonju_healer: 'rg_jeonju_healer', rg_suwon_fortress: 'rg_suwon_fortress', rg_suwon_prototype: 'rg_suwon_prototype',
      rg_suwon_strike: 'rg_suwon_strike', rg_ulsan_rock: 'rg_ulsan_rock', rg_ulsan_shipyard: 'rg_ulsan_shipyard', rg_ulsan_workers: 'rg_ulsan_workers',
      road_bandits: 'road_bandits', road_bridge: 'road_bridge', road_camp: 'road_camp', road_checkpoint: 'road_checkpoint',
      road_hitchhiker: 'road_hitchhiker', road_meet: 'road_meet', road_merchant: 'road_merchant', road_shrine: 'road_shrine',
      road_signal: 'road_signal', road_storm: 'road_storm', road_stray: 'road_stray', road_view: 'road_view',
      road_wreck: 'road_wreck', role_companion_doubt: 'role_companion_doubt', role_disciple_offer: 'role_disciple_offer', role_exam_reunion: 'role_exam_reunion',
      role_friend_guarantee: 'role_friend_guarantee', role_friend_hurt: 'role_friend_hurt', role_friend_move: 'role_friend_move', role_guild_credit: 'role_guild_credit',
      role_master_ill: 'role_master_ill', role_mentor_favor: 'role_mentor_favor', role_rival_public: 'role_rival_public', role_rival_teamup: 'role_rival_teamup',
      role_spouse_home: 'role_spouse_home', ruins: 'ruins', smug_0: 'smug_0', smug_1: 'smug_1',
      smug_2: 'smug_2', smug_3: 'smug_3', society_awakening_kid: 'society_awakening_kid', society_documentary: 'society_documentary',
      sponsor_offer: 'sponsor_offer', sponsor_offer2: 'sponsor_offer2', street_drone_ads: 'street_drone_ads', street_food: 'street_food',
      street_kid_fan: 'street_kid_fan', street_old_hunter: 'street_old_hunter', street_pickpocket: 'street_pickpocket', street_protest: 'street_protest',
      sub_0: 'sub_0', sub_1: 'sub_1', sub_2: 'sub_2', sub_3: 'sub_3',
      sys_penalty: 'sys_penalty', sys_penalty_kama: 'sys_penalty_kama', voice_0: 'voice_0', voice_1: 'voice_1',
      voice_2: 'voice_2', voice_3: 'voice_3', voice_4: 'voice_4', vow_revenge: 'vow_revenge',
    };
    const pick = (k) => (/^(street|city|arrive|pocha|reg_|smug|black|market|shop|guild)/.test(k) ? 'city'
      : /^(field|road|race|explore|site)/.test(k) ? 'field'
      : /(gate|rift|break|raid|dungeon|boss)/.test(k) ? 'gate'
      : /^(rel_|npc|vow|fam|child|age_classmate|friend|love|mentor|class_)/.test(k) ? 'people'
      : /^(media|society|rank_|news|nuri|debut|award|press)/.test(k) ? 'news'
      : /^(odd|cult|voice|age_|sub_|dream|ghost)/.test(k) ? 'night' : 'city');
    const key = scenes[id] || pick(String(id || ''));
    return `<img class="event-art" src="assets/events/${key}.webp" width="1280" height="720" alt="사건 삽화" decoding="async" draggable="false">`;
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
