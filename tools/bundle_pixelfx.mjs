#!/usr/bin/env node
// pixelfx(MIT) 코어 + 전투용 이펙트를 IIFE로 묶어 js/vendor_pixelfx.js 로 쓴다.
// 사용: node tools/bundle_pixelfx.mjs
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const px = process.env.PIXELFX_ROOT || '/tmp/pixelfx';
const out = join(root, 'js', 'vendor_pixelfx.js');
const entry = join('/tmp', `pixelfx_entry_${process.pid}.mjs`);

const EFFECTS = [
  ['swordSlash', 'melee/sword-slash.js'],
  ['doubleSlash', 'melee/double-slash.js'],
  ['spinSlash', 'melee/spin-slash.js'],
  ['heavyCleave', 'melee/heavy-cleave.js'],
  ['thrust', 'melee/thrust.js'],
  ['daggerFlurry', 'melee/dagger-flurry.js'],
  ['hammerSmash', 'melee/hammer-smash.js'],
  ['clawSwipe', 'melee/claw-swipe.js'],
  ['uppercut', 'melee/uppercut.js'],
  ['whipCrack', 'melee/whip-crack.js'],
  ['hitSpark', 'impacts/hit-spark.js'],
  ['critHit', 'impacts/crit-hit.js'],
  ['bluntHit', 'impacts/blunt-hit.js'],
  ['groundSlam', 'impacts/ground-slam.js'],
  ['hitFlash', 'impacts/hit-flash.js'],
  ['arrow', 'projectiles/arrow.js'],
  ['bulletTracer', 'projectiles/bullet-tracer.js'],
  ['magicMissile', 'projectiles/magic-missile.js'],
  ['plasmaShot', 'projectiles/plasma-shot.js'],
  ['energyDisc', 'projectiles/energy-disc.js'],
  ['arcaneOrb', 'arcane/arcane-orb.js'],
  ['arcaneBeam', 'arcane/arcane-beam.js'],
  ['magicCircleCast', 'arcane/magic-circle-cast.js'],
  ['fireball', 'fire/fireball.js'],
  ['fireBreath', 'fire/fire-breath.js'],
  ['fireRing', 'fire/fire-ring.js'],
  ['flamePillar', 'fire/flame-pillar.js'],
  ['holyPillar', 'holy/holy-pillar.js'],
  ['smallExplosion', 'explosions/small-explosion.js'],
  ['bigExplosion', 'explosions/big-explosion.js'],
  ['cartoonPow', 'explosions/cartoon-pow.js'],
  ['frostNova', 'ice/frost-nova.js'],
  ['iceLance', 'ice/ice-lance.js'],
  ['lightningStrike', 'lightning/lightning-strike.js'],
  ['chainLightning', 'lightning/chain-lightning.js'],
  ['zapHit', 'lightning/zap-hit.js'],
  ['holySmite', 'holy/smite.js'],
  ['heal', 'holy/heal.js'],
  ['divineShield', 'holy/divine-shield.js'],
  ['darkExplosion', 'shadow/dark-explosion.js'],
  ['hexSigil', 'shadow/hex-sigil.js'],
  ['curse', 'shadow/curse.js'],
  ['poisonCloud', 'nature/poison-cloud.js'],
  ['earthSpike', 'nature/earth-spike.js'],
  ['leafStorm', 'nature/leaf-storm.js'],
];

const imports = EFFECTS.map(([name, path], i) =>
  `import * as _e${i} from ${JSON.stringify(join(px, 'src/fx', path))};`
).join('\n');
const assign = EFFECTS.map(([name], i) => `  ${name}: _e${i},`).join('\n');

writeFileSync(entry, `import * as core from ${JSON.stringify(join(px, 'src/core/index.js'))};
${imports}
const PIXELFX = {
  ...core,
  effects: {
${assign}
  },
};
export default PIXELFX;
`);

const require = createRequire(import.meta.url);
let esbuildPath;
try {
  esbuildPath = require.resolve('esbuild');
} catch {
  // use npx-installed esbuild via dynamic import of the API from a temp install
}

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'iife',
  globalName: 'PIXELFX',
  outfile: out,
  target: ['es2017'],
  minify: true,
  logLevel: 'warning',
  banner: {
    js: '/* pixelfx (MIT) — https://github.com/patch-gg/pixelfx — adapted for Gate Chronicle combat FX */',
  },
});

// esbuild IIFE with export default ends as PIXELFX = { default: {...} } sometimes;
// normalize so PIXELFX has createFx / effects at top level.
let src = readFileSync(out, 'utf8');
src += `\n;(() => { const P = typeof PIXELFX !== 'undefined' ? PIXELFX : null; if (!P) return; if (P.default && !P.createFx) { const d = P.default; for (const k of Object.keys(d)) P[k] = d[k]; } })();\n`;
writeFileSync(out, src);
console.log('wrote', out, `(${readFileSync(out).length} bytes)`, EFFECTS.length, 'effects');
