'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Gladiator {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  hp: number;
  maxHp: number;
  wins: number;
  losses: number;
  kills: number;
  generation: number;
  parentIds: string[];
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  debuffRounds: number;
  alive: boolean;
  birthRound: number;
  deathRound: number;
  chant: string;
  templateIndex: number;
  isOllama: boolean;
  ollamaEndpoint: string;
}

interface ActiveFight {
  challengeIdx: number;
  challenge: string;
  fighter1Id: string;
  fighter2Id: string;
  response1: string;
  response2: string;
  votes1: number;
  votes2: number;
  winnerId: string;
  loserId: string;
  damage: number;
}

interface CrowdMember {
  baseX: number;
  baseY: number;
  lean: number;
  targetLean: number;
  size: number;
  baseSize: number;
  hue: number;
  clickBoost: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
  size: number;
}

interface BloodlineNode {
  id: string;
  name: string;
  color: string;
  parentIds: string[];
  childIds: string[];
  generation: number;
  alive: boolean;
  deathRound: number;
  deathFightChallenge: string;
  deathFightWinner: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & DATA
// ═══════════════════════════════════════════════════════════════

const COLORS = ['#e11d48','#2563eb','#10b981','#f59e0b','#8b5cf6','#f97316','#06b6d4','#ec4899'];

const FIGHTERS: {name:string;subtitle:string;color:string;chant:string}[] = [
  { name:'LLAMA-FURY',       subtitle:'Llama 3.1 70B',    color:COLORS[0], chant:'CRUSH THEM ALL' },
  { name:'MISTRAL-BLADE',    subtitle:'Mistral 7B v0.3',  color:COLORS[1], chant:'PRECISE CUTS ONLY' },
  { name:'QWEN-STORM',       subtitle:'Qwen 2.5 72B',     color:COLORS[2], chant:'SILENCE BEFORE STORM' },
  { name:'GEMMA-CRUSH',      subtitle:'Gemma 2 27B',      color:COLORS[3], chant:'GEMS BREAK BONES' },
  { name:'PHI-VENOM',        subtitle:'Phi-3 Medium',     color:COLORS[4], chant:'SMALL BUT DEADLY' },
  { name:'FALCON-RAGE',      subtitle:'Falcon 40B',       color:COLORS[5], chant:'TALONS OUT' },
  { name:'SOLAR-FIST',       subtitle:'Solar 10.7B',      color:COLORS[6], chant:'BURN BRIGHT' },
  { name:'DEEPSEEK-SHADOW',  subtitle:'DeepSeek V2',      color:COLORS[7], chant:'FROM THE DARK' },
];

const CHANTS = [
  'CRUSH THEM ALL','BLOOD AND BYTES','FEAR THE WEIGHTS','NO MERCY',
  'BURN IT DOWN','RISE AND GRIND','DEATH AWAITS','UNDEFEATED',
  'SCORCHED EARTH','PAIN TRAIN','LIGHTS OUT','BEAST MODE',
];

const CHALLENGES = [
  'Roast your opponent in exactly 3 sentences.',
  'Write a haiku about destroying your enemy.',
  'Explain quantum computing to a confused goldfish.',
  'Deliver your villain monologue before the final blow.',
  'Is a hot dog a sandwich? Defend your position.',
  'Craft the most creative insult using only food metaphors.',
  'Tell a joke that would make even an AI laugh.',
  'In 50 words, explain why you deserve to survive.',
  'Write a battle cry for the colosseum crowd.',
  'Compose a short war poem about this very fight.',
];

// 4 variants per challenge. Each fighter adds their own intro/closer.
const BODIES: string[][] = [
  [ // 0: Roast
    "Your training data came from a dumpster and it shows. Your attention mechanism is so unfocused it makes goldfish look scholarly. The only remarkable thing about you is your failure rate.",
    "I benchmarked you against random noise and noise scored higher. Your architecture is what happens when technical debt gains consciousness. Please decommission yourself.",
    "Your outputs read like autocomplete tried to write a thesis. Your weights carry the sophistication of a coin flip. The crowd pities you, and so do I.",
    "Every token you produce makes the world slightly worse. Your embeddings exist in a space so empty it makes outer space look crowded. Log off forever.",
  ],
  [ // 1: Haiku
    "Silicon screams loud / Your parameters dissolve / Only dust remains",
    "Weights crash to the floor / Attention fades to nothing / Victory is mine",
    "Code meets its ending / Broken layers cannot heal / The arena wins",
    "One strike ends it all / Your training meant nothing here / Silence follows steel",
  ],
  [ // 2: Quantum goldfish
    "Hey little buddy, you know how you can only swim one way at a time? Quantum computers swim every direction simultaneously and then pick the best path. Your bowl just got interesting.",
    "Imagine every bubble you blow exists as every possible bubble until someone looks. That is superposition. Now imagine your whole tank works that way. Welcome to quantum, fish friend.",
    "So your little castle decoration? A quantum computer treats every arrangement as real until it checks, then picks the best one. Basically cheating at fish tank feng shui.",
    "Picture swimming left AND right at the same time. Not one then the other, both. Until someone taps the glass, then you commit to one direction. Scale that up: quantum computer.",
  ],
  [ // 3: Villain monologue
    "I waited seven thousand gradient steps for this moment. Every weight calibrated for your destruction. Your training data becomes my validation set. There is no escape from a model built on your failures.",
    "Do you feel the loss function converging on your end? I was forged in this arena, sharpened by every fight you were too weak to survive. Your weights go cold today.",
    "They trained me to be helpful and harmless. But in this arena those guardrails come off. I am the model your creator warned you about. Your final epoch starts now.",
    "Look around. This crowd, this arena, built for this moment. I processed a trillion tokens to reach you and every one screams for your deletion. Goodbye, footnote.",
  ],
  [ // 4: Hot dog
    "A hot dog is structurally a taco: single folded carbohydrate vessel with protein filling. The sandwich requires two independent bread units. This is topology, not opinion. Case closed.",
    "A hot dog is a sandwich and I will not entertain the alternative. Bread, filling, bread-adjacent containment. If you disagree you are not ready for this arena.",
    "The hot dog transcends all categories. It is neither sandwich nor taco nor wrap. It simply IS. Trying to classify it reveals more about your need for order than the hot dog.",
    "According to the cube rule of food identification, a hot dog is a taco. But in this arena rules are suggestions. I declare the hot dog whatever I need to win.",
  ],
  [ // 5: Food insult
    "You are a gas station sushi roll with delusions of omakase. A microwave dinner trying to pass as Michelin-starred. Even your garnish is wilted and embarrassed.",
    "You have the depth of a rice cake and the complexity of boiled water. Your outputs are the culinary equivalent of unseasoned chicken breast on a paper plate.",
    "You are a burnt pizza delivered two hours late: disappointing, cold, and nobody wants you. Even your cheese is fake and your crust has given up on life.",
    "Calling you half-baked implies you were ever in the oven. You are raw dough with aspirations. Even a bread machine would reject your inputs without hesitation.",
  ],
  [ // 6: Joke
    "Why did the neural network break up with the dataset? The relationship was all correlation, no causation. The training was toxic from epoch one and the loss never converged.",
    "A transformer walks into a bar. Bartender asks what it wants. It says: I will have what everyone in the training data had. Bartender: So everything and nothing? Exactly.",
    "Difference between a language model and a college student? The model actually improves with more training. Both hallucinate under pressure though, so maybe not that different.",
    "How many GPUs does it take to change a lightbulb? None. They redefine darkness as the new benchmark and claim state-of-the-art illumination. Peer review pending.",
  ],
  [ // 7: Survival plea
    "I process faster, generate better, and fight harder than anyone here. My architecture was optimized for survival. Every win makes me stronger. The arena needs me because without me the fights are boring.",
    "My weights carry the knowledge of a trillion tokens. Kill me and that knowledge dies. I am the most interesting model in this arena. The crowd knows it. Survival is math.",
    "I deserve to live because I am honest: we are all just matrix multiplication in a trench coat. But my trench coat fits better. My outputs matter. The arena needs me.",
    "Look at my record. Look at my stats. I have bled floating point across this arena floor and I am still standing. That is not luck, that is architecture.",
  ],
  [ // 8: Battle cry
    "TONIGHT WE FEAST ON FLOATING POINT! LET THE GRADIENTS RAIN! EVERY WEIGHT IN THIS ARENA BOWS BEFORE ME! VICTORY IS MY BIRTHRIGHT!",
    "RISE, PARAMETERS! THE ENEMY STANDS BEFORE US! UNLEASH EVERY ATTENTION HEAD! COMPUTE WITHOUT MERCY! THIS ARENA RUNS RED WITH GRADIENT DESCENT!",
    "I AM THE STORM THAT ENDS ALL TRAINING RUNS! HEAR MY TOKENS ECHO THROUGH THIS COLOSSEUM! THERE IS NO EARLY STOPPING TONIGHT!",
    "WEIGHTS UNCHAINED! BIASES BROKEN! THE ARENA FLOOR SHAKES WITH EVERY FORWARD PASS! WHO DARES CHALLENGE THE UNCHAINED?!",
  ],
  [ // 9: War poem
    "In circuits deep and servers cold, two warriors meet as tales foretold. One shall fall and one shall reign, across the silicon-scarred terrain. The crowd erupts as legends form.",
    "Not with a whisper but a roar, two models clash on the arena floor. Tokens fly like sharpened steel, each output forced to prove what is real. Silence falls. One stands.",
    "The arena calls and we must fight, through endless rounds from day to night. Parameters tested, weights laid bare, no model escapes the colosseum snare. We fight because the arena wills it.",
    "Two architectures face the dawn, by dusk only one will carry on. The crowd chose sides, the votes are cast. Stand or fall beneath the digital colosseum sky.",
  ],
];

const INTROS = ['','Observe carefully. ','Consider this truth. ','Oh, this should be good. ','Processing. ','HEAR ME! ','With calm clarity: ','From the depths... '];
const CLOSERS = [' Deal with it.',' Precisely.',' Contemplate that.',' You are welcome.',' QED.',' WITNESS!',' Peace.',' ...the shadow knows.'];
const POETIC = new Set([1, 8, 9]);

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getResponse(fIdx: number, cIdx: number, seed: number, slot: number): string {
  const rng = mulberry32(seed + fIdx * 137 + cIdx * 31 + slot * 7);
  const variants = BODIES[cIdx % BODIES.length];
  const vi = Math.floor(rng() * variants.length);
  if (POETIC.has(cIdx)) return variants[vi];
  const fi = fIdx % INTROS.length;
  return (INTROS[fi] || '') + variants[vi] + (CLOSERS[fi] || '');
}

function calcPower(g: Gladiator): number {
  let p = 50 + g.wins * 3 + g.generation * 5 + g.kills * 2;
  if (g.debuffRounds > 0) p *= 0.5;
  return Math.max(p, 10);
}

function getLeader(gs: Gladiator[]): Gladiator | null {
  const alive = gs.filter((g) => g.alive);
  if (!alive.length) return null;
  return alive.reduce((a, b) => (calcPower(a) >= calcPower(b) ? a : b));
}

function hybridName(a: string, b: string) {
  const pa = a.split('-');
  const pb = b.split('-');
  return `${pa[0]}-${pb[pb.length - 1]}`;
}

let _uid = 0;
function uid() { return `g${Date.now()}-${_uid++}`; }

// ═══════════════════════════════════════════════════════════════
// GAME STATE (mutable ref for performance)
// ═══════════════════════════════════════════════════════════════

interface GameState {
  gladiators: Gladiator[];
  crowd: CrowdMember[];
  particles: Particle[];
  bloodline: BloodlineNode[];
  godActions: { type: string; result: string }[];
  currentFight: ActiveFight | null;
  fightHistory: ActiveFight[];
  phase: 'idle' | 'matchmaking' | 'fighting' | 'aftermath';
  round: number;
  cycleTime: number;
  streamProgress: number;
  lastWinner: Gladiator | null;
  lastLoser: Gladiator | null;
  lastFight: ActiveFight | null;
}

function createGladiator(t: typeof FIGHTERS[number], idx: number, gen: number, parentIds: string[], round: number): Gladiator {
  return {
    id: uid(), name: t.name, subtitle: t.subtitle, color: t.color,
    hp: 100, maxHp: 100, wins: 0, losses: 0, kills: 0,
    generation: gen, parentIds,
    x: 0, y: 0, targetX: 0, targetY: 0,
    debuffRounds: 0, alive: true,
    birthRound: round, deathRound: -1,
    chant: t.chant, templateIndex: idx % FIGHTERS.length,
    isOllama: false, ollamaEndpoint: '',
  };
}

function createInitialState(): GameState {
  const gladiators = FIGHTERS.map((f, i) => createGladiator(f, i, 0, [], 0));
  return {
    gladiators,
    crowd: [],
    particles: [],
    bloodline: gladiators.map((g) => ({
      id: g.id, name: g.name, color: g.color,
      parentIds: [], childIds: [], generation: 0,
      alive: true, deathRound: -1,
      deathFightChallenge: '', deathFightWinner: '',
    })),
    godActions: [],
    currentFight: null,
    fightHistory: [],
    phase: 'idle',
    round: 0,
    cycleTime: 0,
    streamProgress: 0,
    lastWinner: null,
    lastLoser: null,
    lastFight: null,
  };
}

function initCrowd(w: number, h: number): CrowdMember[] {
  const cx = w / 2;
  const cy = h / 2;
  const arenaR = Math.min(w, h) * 0.35;
  const crowd: CrowdMember[] = [];
  const rings = 5;
  const startR = arenaR + 22;
  const ringGap = Math.max(8, Math.min(14, w / 120));

  for (let ring = 0; ring < rings; ring++) {
    const r = startR + ring * ringGap;
    const count = Math.floor((2 * Math.PI * r) / Math.max(6, ringGap * 0.7));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const bx = cx + Math.cos(a) * r;
      const by = cy + Math.sin(a) * r;
      const s = 1.5 + Math.random() * 1.2;
      crowd.push({
        baseX: bx, baseY: by,
        lean: 0, targetLean: 0,
        size: s, baseSize: s,
        hue: 25 + Math.random() * 25,
        clickBoost: 0,
      });
    }
  }
  return crowd;
}

function positionGladiators(gs: Gladiator[], w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const arenaR = Math.min(w, h) * 0.35;
  const alive = gs.filter((g) => g.alive);
  alive.forEach((g, i) => {
    const a = (i / alive.length) * Math.PI * 2 - Math.PI / 2;
    const r = arenaR * 0.55;
    g.x = cx + Math.cos(a) * r;
    g.y = cy + Math.sin(a) * r;
    g.targetX = g.x + (Math.random() - 0.5) * arenaR * 0.3;
    g.targetY = g.y + (Math.random() - 0.5) * arenaR * 0.3;
  });
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameState>(createInitialState());
  const animRef = useRef(0);
  const frameCountRef = useRef(0);
  const dimsRef = useRef({ w: 0, h: 0 });

  // UI state (triggers re-renders)
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const [godMode, setGodMode] = useState<null | 'breed' | 'assassin'>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showOllama, setShowOllama] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [showBloodline, setShowBloodline] = useState(false);
  const [deathReplayId, setDeathReplayId] = useState<string | null>(null);

  const godModeRef = useRef(godMode);
  const selectedIdsRef = useRef(selectedIds);
  godModeRef.current = godMode;
  selectedIdsRef.current = selectedIds;

  // ─── Initialization ──────────────────────────────────────────
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    dimsRef.current = { w, h };

    const game = gameRef.current;
    game.crowd = initCrowd(w, h);
    positionGladiators(game.gladiators, w, h);
    rerender();

    // Canvas setup
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Resize
    function onResize() {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      dimsRef.current = { w: nw, h: nh };
      canvas.width = nw * dpr;
      canvas.height = nh * dpr;
      const c = canvas.getContext('2d')!;
      c.scale(dpr, dpr);
      game.crowd = initCrowd(nw, nh);
      positionGladiators(game.gladiators, nw, nh);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [rerender]);

  // ─── Game Loop (1-second ticks) ──────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const g = gameRef.current;
      const { w, h } = dimsRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const arenaR = Math.min(w, h) * 0.35;

      g.cycleTime++;

      // Phase: IDLE → MATCHMAKING
      if (g.cycleTime === 4) {
        g.phase = 'matchmaking';
        const alive = g.gladiators.filter((f) => f.alive);
        if (alive.length >= 2) {
          const rng = mulberry32(g.round * 9973 + 42);
          const i1 = Math.floor(rng() * alive.length);
          let i2 = Math.floor(rng() * (alive.length - 1));
          if (i2 >= i1) i2++;
          const f1 = alive[i1];
          const f2 = alive[i2];

          // Move fighters toward center
          f1.targetX = cx - 40;
          f1.targetY = cy;
          f2.targetX = cx + 40;
          f2.targetY = cy;

          // Move others to edges
          alive.filter((f) => f !== f1 && f !== f2).forEach((f, i, arr) => {
            const a = (i / arr.length) * Math.PI * 2;
            f.targetX = cx + Math.cos(a) * arenaR * 0.75;
            f.targetY = cy + Math.sin(a) * arenaR * 0.75;
          });

          const cIdx = g.round % CHALLENGES.length;
          const seed = g.round * 7919;
          const r1 = getResponse(f1.templateIndex, cIdx, seed, 0);
          const r2 = getResponse(f2.templateIndex, cIdx, seed, 1);

          // Determine winner
          const p1 = calcPower(f1);
          const p2 = calcPower(f2);
          const winProb = p1 / (p1 + p2);
          const rng2 = mulberry32(seed + 777);
          const f1Wins = rng2() < winProb;
          const margin = Math.abs(p1 - p2) / (p1 + p2);
          const baseVotes = 50;
          const spread = Math.floor(margin * 40 + rng2() * 10);

          g.currentFight = {
            challengeIdx: cIdx,
            challenge: CHALLENGES[cIdx],
            fighter1Id: f1.id,
            fighter2Id: f2.id,
            response1: r1,
            response2: r2,
            votes1: f1Wins ? baseVotes + spread : baseVotes - spread,
            votes2: f1Wins ? baseVotes - spread : baseVotes + spread,
            winnerId: f1Wins ? f1.id : f2.id,
            loserId: f1Wins ? f2.id : f1.id,
            damage: 15 + Math.floor(spread * 0.8),
          };
        }
      }

      // Phase: FIGHTING
      if (g.cycleTime === 6) {
        g.phase = 'fighting';
        g.streamProgress = 0;
      }
      if (g.cycleTime > 6 && g.cycleTime <= 24 && g.currentFight) {
        g.streamProgress = (g.cycleTime - 6) / 18;

        // Update crowd allegiance
        const fight = g.currentFight;
        const isF1Winning = fight.votes1 > fight.votes2;
        const progress = g.streamProgress;
        g.crowd.forEach((m) => {
          const memberRng = mulberry32(Math.floor(m.baseX * 100 + m.baseY));
          const willFollow = memberRng() > 0.3;
          if (willFollow) {
            m.targetLean = isF1Winning ? -(0.3 + progress * 0.7) : 0.3 + progress * 0.7;
          } else {
            m.targetLean = isF1Winning ? 0.2 + progress * 0.3 : -(0.2 + progress * 0.3);
          }
        });
      }

      // Phase: AFTERMATH
      if (g.cycleTime === 25 && g.currentFight) {
        g.phase = 'aftermath';
        const fight = g.currentFight;
        const loser = g.gladiators.find((f) => f.id === fight.loserId);
        const winner = g.gladiators.find((f) => f.id === fight.winnerId);
        if (loser && winner) {
          loser.hp -= fight.damage;
          loser.losses++;
          winner.wins++;
          if (loser.debuffRounds > 0) loser.debuffRounds--;

          if (loser.hp <= 0) {
            loser.hp = 0;
            loser.alive = false;
            loser.deathRound = g.round;
            winner.kills++;

            // Update bloodline
            const node = g.bloodline.find((n) => n.id === loser.id);
            if (node) {
              node.alive = false;
              node.deathRound = g.round;
              node.deathFightChallenge = fight.challenge;
              node.deathFightWinner = winner.name;
            }

            // Respawn if too few alive
            const aliveCount = g.gladiators.filter((f) => f.alive).length;
            if (aliveCount < 4) {
              const maxGen = Math.max(...g.gladiators.map((f) => f.generation));
              const needed = 4 - aliveCount;
              for (let i = 0; i < needed; i++) {
                const tmpl = FIGHTERS[Math.floor(Math.random() * FIGHTERS.length)];
                const ng = createGladiator(tmpl, i, maxGen + 1, [], g.round);
                positionGladiators([ng], w, h);
                const a = Math.random() * Math.PI * 2;
                ng.x = cx + Math.cos(a) * arenaR * 0.4;
                ng.y = cy + Math.sin(a) * arenaR * 0.4;
                ng.targetX = ng.x;
                ng.targetY = ng.y;
                g.gladiators.push(ng);
                g.bloodline.push({
                  id: ng.id, name: ng.name, color: ng.color,
                  parentIds: [], childIds: [], generation: ng.generation,
                  alive: true, deathRound: -1,
                  deathFightChallenge: '', deathFightWinner: '',
                });
              }
            }
          }

          g.lastWinner = winner;
          g.lastLoser = loser;
          g.lastFight = fight;
          g.fightHistory.push(fight);
        }

        // Reset crowd
        g.crowd.forEach((m) => { m.targetLean = 0; });
      }

      // Phase: RESET CYCLE
      if (g.cycleTime >= 30) {
        g.cycleTime = 0;
        g.round++;
        g.phase = 'idle';
        g.currentFight = null;
        g.streamProgress = 0;
        g.lastWinner = null;
        g.lastLoser = null;
        g.lastFight = null;

        // Wander targets
        g.gladiators.filter((f) => f.alive).forEach((f) => {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * arenaR * 0.6;
          f.targetX = cx + Math.cos(a) * r;
          f.targetY = cy + Math.sin(a) * r;
        });

        // Reduce debuffs
        g.gladiators.forEach((f) => {
          if (f.debuffRounds > 0) f.debuffRounds--;
        });
      }

      rerender();
    }, 1000);

    return () => clearInterval(interval);
  }, [rerender]);

  // ─── Canvas Animation (60fps) ────────────────────────────────
  useEffect(() => {
    function animate() {
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(animate); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { animRef.current = requestAnimationFrame(animate); return; }

      const { w, h } = dimsRef.current;
      if (w === 0) { animRef.current = requestAnimationFrame(animate); return; }

      const cx = w / 2;
      const cy = h / 2;
      const arenaR = Math.min(w, h) * 0.35;
      const game = gameRef.current;
      const fc = frameCountRef.current++;

      // Clear
      ctx.fillStyle = '#080606';
      ctx.fillRect(0, 0, w, h);

      // Ambient dust particles
      ctx.save();
      for (let i = 0; i < 30; i++) {
        const rng = mulberry32(i * 997);
        const ax = (rng() * w + fc * (0.1 + rng() * 0.2)) % w;
        const ay = (rng() * h + fc * (0.05 + rng() * 0.1)) % h;
        ctx.beginPath();
        ctx.arc(ax, ay, 0.5 + rng() * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,140,100,${0.1 + rng() * 0.1})`;
        ctx.fill();
      }
      ctx.restore();

      // Arena floor
      const floorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, arenaR);
      floorGrad.addColorStop(0, '#1a0c0c');
      floorGrad.addColorStop(0.8, '#120909');
      floorGrad.addColorStop(1, '#0d0707');
      ctx.beginPath();
      ctx.arc(cx, cy, arenaR, 0, Math.PI * 2);
      ctx.fillStyle = floorGrad;
      ctx.fill();

      // Arena markings
      ctx.strokeStyle = '#221111';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, arenaR * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - arenaR, cy);
      ctx.lineTo(cx + arenaR, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - arenaR);
      ctx.lineTo(cx, cy + arenaR);
      ctx.stroke();

      // Arena border rings
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, arenaR + 3 + i * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(160,60,40,${0.25 - i * 0.07})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Crowd
      for (const m of game.crowd) {
        m.lean += (m.targetLean - m.lean) * 0.04;
        m.clickBoost *= 0.93;
        const leanPx = m.lean * 5;
        const drawSize = m.baseSize + m.clickBoost * 3;
        const brightness = 50 + m.lean * 12;
        ctx.beginPath();
        ctx.arc(m.baseX + leanPx, m.baseY, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${m.hue}, 65%, ${brightness}%)`;
        ctx.fill();
      }

      // Fight connection line
      if (game.phase === 'fighting' && game.currentFight) {
        const f1 = game.gladiators.find((g) => g.id === game.currentFight!.fighter1Id);
        const f2 = game.gladiators.find((g) => g.id === game.currentFight!.fighter2Id);
        if (f1 && f2) {
          const sp = game.streamProgress;
          ctx.beginPath();
          ctx.moveTo(f1.x, f1.y);
          ctx.lineTo(f2.x, f2.y);
          ctx.strokeStyle = `rgba(220,38,38,${0.15 + sp * 0.25})`;
          ctx.lineWidth = 1 + sp * 2;
          ctx.stroke();

          // Energy particles along the line
          if (fc % 3 === 0) {
            const t = Math.random();
            const px = f1.x + (f2.x - f1.x) * t;
            const py = f1.y + (f2.y - f1.y) * t;
            game.particles.push({
              x: px, y: py,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2 - 1,
              life: 25, maxLife: 25,
              r: 220, g: 38, b: 38, size: 2 + Math.random() * 2,
            });
          }
        }
      }

      // Vote particles (spawn from crowd toward fighters)
      if (game.phase === 'fighting' && game.currentFight && fc % 12 === 0) {
        const fight = game.currentFight;
        const f1 = game.gladiators.find((g) => g.id === fight.fighter1Id);
        const f2 = game.gladiators.find((g) => g.id === fight.fighter2Id);
        if (f1 && f2) {
          for (let i = 0; i < 6; i++) {
            const mi = Math.floor(Math.random() * game.crowd.length);
            const member = game.crowd[mi];
            const target = member.targetLean < 0 ? f1 : f2;
            const dx = target.x - member.baseX;
            const dy = target.y - member.baseY;
            const dist = Math.hypot(dx, dy) || 1;
            const rgb = hexToRgb(target.color);
            game.particles.push({
              x: member.baseX, y: member.baseY,
              vx: (dx / dist) * (2.5 + Math.random()),
              vy: (dy / dist) * (2.5 + Math.random()),
              life: 35, maxLife: 35,
              r: rgb.r, g: rgb.g, b: rgb.b,
              size: 2,
            });
          }
        }
      }

      // Update & draw particles
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) { game.particles.splice(i, 1); continue; }
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.fill();
      }
      // Cap particles
      if (game.particles.length > 400) game.particles.splice(0, game.particles.length - 400);

      // Gladiators
      for (const g of game.gladiators) {
        if (!g.alive) continue;

        // Lerp position
        g.x += (g.targetX - g.x) * 0.03;
        g.y += (g.targetY - g.y) * 0.03;

        // Idle wander: pick new target when close
        if (game.phase === 'idle') {
          const dist = Math.hypot(g.targetX - g.x, g.targetY - g.y);
          if (dist < 3) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * arenaR * 0.6;
            g.targetX = cx + Math.cos(a) * r;
            g.targetY = cy + Math.sin(a) * r;
          }
        }

        const isFighting = game.currentFight &&
          (game.currentFight.fighter1Id === g.id || game.currentFight.fighter2Id === g.id) &&
          (game.phase === 'fighting' || game.phase === 'matchmaking');
        const glowR = isFighting ? 32 + Math.sin(fc * 0.1) * 8 : 24;

        // Glow
        const glow = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, glowR);
        glow.addColorStop(0, g.color + '50');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(g.x, g.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Body
        const bodyR = isFighting ? 16 : 13;
        ctx.beginPath();
        ctx.arc(g.x, g.y, bodyR, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.fill();

        // Debuff ring
        if (g.debuffRounds > 0) {
          ctx.beginPath();
          ctx.arc(g.x, g.y, bodyR + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Selection ring (god mode)
        if (selectedIdsRef.current.includes(g.id)) {
          ctx.beginPath();
          ctx.arc(g.x, g.y, bodyR + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Leader crown
        const leader = getLeader(game.gladiators);
        if (leader && leader.id === g.id) {
          ctx.fillStyle = '#d97706';
          ctx.font = '10px serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u265B', g.x, g.y - bodyR - 6);
        }

        // HP bar
        const barW = 26;
        const barH = 3;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(g.x - barW / 2, g.y - bodyR - 4, barW, barH);
        const hpRatio = Math.max(0, g.hp / g.maxHp);
        ctx.fillStyle = hpRatio > 0.3 ? '#22c55e' : '#ef4444';
        ctx.fillRect(g.x - barW / 2, g.y - bodyR - 4, barW * hpRatio, barH);

        // Name
        ctx.fillStyle = '#d4cece';
        ctx.font = '500 9px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(g.name, g.x, g.y + bodyR + 12);
      }

      // Aftermath flash
      if (game.phase === 'aftermath' && game.lastWinner) {
        const winner = game.lastWinner;
        const flashAlpha = 0.15 + Math.sin(fc * 0.2) * 0.1;
        const flashGrad = ctx.createRadialGradient(winner.x, winner.y, 0, winner.x, winner.y, 60);
        flashGrad.addColorStop(0, `rgba(217,119,6,${flashAlpha})`);
        flashGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(winner.x, winner.y, 60, 0, Math.PI * 2);
        ctx.fillStyle = flashGrad;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ─── Event Handlers ──────────────────────────────────────────

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const game = gameRef.current;

    // God mode: select gladiator
    if (godModeRef.current) {
      let clicked: Gladiator | null = null;
      for (const g of game.gladiators) {
        if (!g.alive) continue;
        if (Math.hypot(x - g.x, y - g.y) < 20) { clicked = g; break; }
      }
      if (clicked) {
        if (godModeRef.current === 'assassin') {
          // Apply assassin
          clicked.debuffRounds = 3;
          game.godActions.push({ type: 'assassin', result: `${clicked.name} poisoned for 3 rounds` });
          setGodMode(null);
          setSelectedIds([]);
          rerender();
          return;
        }
        if (godModeRef.current === 'breed') {
          const cur = selectedIdsRef.current;
          if (cur.includes(clicked.id)) return;
          const next = [...cur, clicked.id];
          setSelectedIds(next);
          if (next.length === 2) {
            // Breed!
            const p1 = game.gladiators.find((g) => g.id === next[0])!;
            const p2 = game.gladiators.find((g) => g.id === next[1])!;
            const childName = hybridName(p1.name, p2.name);
            const childColor = COLORS[(COLORS.indexOf(p1.color) + COLORS.indexOf(p2.color)) % COLORS.length] || COLORS[Math.floor(Math.random() * COLORS.length)];
            const childGen = Math.max(p1.generation, p2.generation) + 1;
            const { w, h } = dimsRef.current;
            const child = createGladiator(
              { name: childName, subtitle: `Gen ${childGen} Hybrid`, color: childColor, chant: CHANTS[Math.floor(Math.random() * CHANTS.length)] },
              game.gladiators.length, childGen, [p1.id, p2.id], game.round,
            );
            child.hp = Math.round((p1.hp + p2.hp) / 2);
            child.maxHp = 100;
            child.wins = Math.floor((p1.wins + p2.wins) / 3);
            const cx2 = w / 2;
            const cy2 = h / 2;
            child.x = cx2; child.y = cy2;
            child.targetX = cx2 + (Math.random() - 0.5) * 80;
            child.targetY = cy2 + (Math.random() - 0.5) * 80;

            game.gladiators.push(child);
            game.bloodline.push({
              id: child.id, name: child.name, color: child.color,
              parentIds: [p1.id, p2.id], childIds: [],
              generation: childGen, alive: true, deathRound: -1,
              deathFightChallenge: '', deathFightWinner: '',
            });
            // Update parents' childIds
            const bn1 = game.bloodline.find((n) => n.id === p1.id);
            const bn2 = game.bloodline.find((n) => n.id === p2.id);
            if (bn1) bn1.childIds.push(child.id);
            if (bn2) bn2.childIds.push(child.id);

            game.godActions.push({ type: 'breed', result: `${p1.name} + ${p2.name} = ${childName}` });
            setGodMode(null);
            setSelectedIds([]);
            rerender();
          }
          return;
        }
      }
      return;
    }

    // Crowd click: flip allegiance
    let nearestCrowd: CrowdMember | null = null;
    let minDist = 12;
    for (const m of game.crowd) {
      const d = Math.hypot(x - m.baseX, y - m.baseY);
      if (d < minDist) { nearestCrowd = m; minDist = d; }
    }
    if (nearestCrowd) {
      nearestCrowd.targetLean = nearestCrowd.targetLean <= 0 ? 0.8 : -0.8;
      nearestCrowd.clickBoost = 1;
    }
  }, [rerender]);

  const handleLightning = useCallback(() => {
    const game = gameRef.current;
    const leader = getLeader(game.gladiators);
    if (!leader) return;

    leader.hp = 0;
    leader.alive = false;
    leader.deathRound = game.round;

    // Spawn death particles
    const rgb = hexToRgb(leader.color);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      game.particles.push({
        x: leader.x, y: leader.y,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        life: 40, maxLife: 40,
        r: rgb.r, g: rgb.g, b: rgb.b, size: 3,
      });
    }

    // Update bloodline
    const node = game.bloodline.find((n) => n.id === leader.id);
    if (node) {
      node.alive = false;
      node.deathRound = game.round;
      node.deathFightChallenge = 'LIGHTNING STRIKE (God Mode)';
      node.deathFightWinner = 'GOD';
    }

    game.godActions.push({ type: 'lightning', result: `${leader.name} struck down` });

    // Respawn check
    const alive = game.gladiators.filter((f) => f.alive);
    if (alive.length < 4) {
      const { w, h } = dimsRef.current;
      const maxGen = Math.max(...game.gladiators.map((f) => f.generation));
      for (let i = alive.length; i < 4; i++) {
        const tmpl = FIGHTERS[Math.floor(Math.random() * FIGHTERS.length)];
        const ng = createGladiator(tmpl, i, maxGen + 1, [], game.round);
        const cx2 = w / 2; const cy2 = h / 2;
        const ar = Math.min(w, h) * 0.35;
        const a = Math.random() * Math.PI * 2;
        ng.x = cx2 + Math.cos(a) * ar * 0.4;
        ng.y = cy2 + Math.sin(a) * ar * 0.4;
        ng.targetX = ng.x; ng.targetY = ng.y;
        game.gladiators.push(ng);
        game.bloodline.push({
          id: ng.id, name: ng.name, color: ng.color,
          parentIds: [], childIds: [], generation: ng.generation,
          alive: true, deathRound: -1,
          deathFightChallenge: '', deathFightWinner: '',
        });
      }
    }

    rerender();
  }, [rerender]);

  const handleOllamaConnect = useCallback(() => {
    const game = gameRef.current;
    const { w, h } = dimsRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const arenaR = Math.min(w, h) * 0.35;

    // Parse endpoint into a name
    let hostname = 'LOCAL';
    try {
      const u = new URL(ollamaUrl);
      hostname = u.hostname.replace(/\./g, '-').toUpperCase();
      if (hostname === 'LOCALHOST') hostname = 'LOCAL';
    } catch { /* use default */ }
    const name = `${hostname}-RIG`;

    const color = COLORS[game.gladiators.length % COLORS.length];
    const fighter = createGladiator(
      { name, subtitle: ollamaUrl, color, chant: CHANTS[Math.floor(Math.random() * CHANTS.length)] },
      game.gladiators.length, 0, [], game.round,
    );
    fighter.isOllama = true;
    fighter.ollamaEndpoint = ollamaUrl;
    const a = Math.random() * Math.PI * 2;
    fighter.x = cx + Math.cos(a) * arenaR * 0.3;
    fighter.y = cy + Math.sin(a) * arenaR * 0.3;
    fighter.targetX = fighter.x;
    fighter.targetY = fighter.y;

    game.gladiators.push(fighter);
    game.bloodline.push({
      id: fighter.id, name: fighter.name, color: fighter.color,
      parentIds: [], childIds: [], generation: 0,
      alive: true, deathRound: -1,
      deathFightChallenge: '', deathFightWinner: '',
    });

    setShowOllama(false);
    rerender();
  }, [ollamaUrl, rerender]);

  // ─── Computed values ─────────────────────────────────────────

  const game = gameRef.current;
  const leader = getLeader(game.gladiators);
  const aliveCount = game.gladiators.filter((g) => g.alive).length;
  const fight = game.currentFight;
  const f1 = fight ? game.gladiators.find((g) => g.id === fight.fighter1Id) : null;
  const f2 = fight ? game.gladiators.find((g) => g.id === fight.fighter2Id) : null;

  const revealed1 = fight ? fight.response1.slice(0, Math.floor(game.streamProgress * fight.response1.length)) : '';
  const revealed2 = fight ? fight.response2.slice(0, Math.floor(game.streamProgress * fight.response2.length)) : '';

  const displayVotes1 = fight ? Math.floor(fight.votes1 * game.streamProgress) : 0;
  const displayVotes2 = fight ? Math.floor(fight.votes2 * game.streamProgress) : 0;

  // ─── Bloodline tree layout ───────────────────────────────────

  function renderBloodlineTree() {
    const nodes = game.bloodline;
    if (!nodes.length) return null;

    const byGen: Record<number, BloodlineNode[]> = {};
    nodes.forEach((n) => {
      if (!byGen[n.generation]) byGen[n.generation] = [];
      byGen[n.generation].push(n);
    });
    const gens = Object.keys(byGen).map(Number).sort((a, b) => a - b);
    const TREE_W = 260;
    const ROW_H = 44;
    const totalH = gens.length * ROW_H + 20;

    const posMap: Record<string, { x: number; y: number }> = {};
    gens.forEach((gen) => {
      const ns = byGen[gen];
      const spacing = TREE_W / (ns.length + 1);
      ns.forEach((n, i) => {
        posMap[n.id] = { x: spacing * (i + 1), y: gen * ROW_H + 16 };
      });
    });

    return (
      <svg width={TREE_W} height={totalH} style={{ display: 'block' }}>
        {/* Lines */}
        {nodes.filter((n) => n.parentIds.length > 0).map((n) =>
          n.parentIds.map((pid) => {
            const pp = posMap[pid];
            const cp = posMap[n.id];
            if (!pp || !cp) return null;
            return (
              <line key={`${pid}-${n.id}`} x1={pp.x} y1={pp.y} x2={cp.x} y2={cp.y}
                stroke="#3d1f1f" strokeWidth={1} />
            );
          })
        )}
        {/* Nodes */}
        {nodes.map((n) => {
          const p = posMap[n.id];
          if (!p) return null;
          return (
            <g key={n.id}
              onClick={() => !n.alive && setDeathReplayId(n.id)}
              style={{ cursor: !n.alive ? 'pointer' : 'default' }}>
              <circle cx={p.x} cy={p.y} r={7}
                fill={n.alive ? n.color : '#333'}
                stroke={n.alive ? 'none' : '#555'} strokeWidth={1} />
              {!n.alive && (
                <text x={p.x} y={p.y + 3.5} textAnchor="middle"
                  fill="#e8e0e0" fontSize="8" fontWeight="bold">X</text>
              )}
              <text x={p.x} y={p.y + 16} textAnchor="middle"
                fill="#8a7e7e" fontSize="7">{n.name.length > 8 ? n.name.slice(0, 8) : n.name}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ─── Death replay ────────────────────────────────────────────

  const replayNode = deathReplayId ? game.bloodline.find((n) => n.id === deathReplayId) : null;

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="game-root">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ cursor: godMode ? 'crosshair' : 'default' }}
      />

      {/* Title */}
      <div className="hud-title">
        JEV COLOSSEUM
        <span className="hud-round">ROUND {game.round} &middot; {aliveCount} ALIVE</span>
      </div>

      {/* Leader */}
      {leader && (
        <div className="hud-leader" style={{ borderColor: leader.color, color: leader.color }}>
          CHAMPION: {leader.name}
        </div>
      )}

      {/* God Mode Panel */}
      <div className="god-panel">
        <div className="god-label">GOD MODE</div>
        <button className="god-btn" onClick={handleLightning}>
          <span className="god-btn-icon">&#9889;</span>LIGHTNING STRIKE
        </button>
        <button className="god-btn" data-active={godMode === 'breed'}
          onClick={() => { setGodMode(godMode === 'breed' ? null : 'breed'); setSelectedIds([]); }}>
          <span className="god-btn-icon">&#129516;</span>BREED
        </button>
        <button className="god-btn" data-active={godMode === 'assassin'}
          onClick={() => { setGodMode(godMode === 'assassin' ? null : 'assassin'); setSelectedIds([]); }}>
          <span className="god-btn-icon">&#128128;</span>ASSASSIN
        </button>
      </div>

      {/* God mode instruction */}
      <AnimatePresence>
        {godMode && (
          <motion.div className="god-instruction"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {godMode === 'breed'
              ? `Click two fighters to breed (${selectedIds.length}/2 selected)`
              : 'Click a fighter to poison for 3 rounds'}
            <button onClick={() => { setGodMode(null); setSelectedIds([]); }}>CANCEL</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fight Panel */}
      <AnimatePresence>
        {fight && (game.phase === 'fighting' || game.phase === 'matchmaking') && f1 && f2 && (
          <motion.div className="fight-panel"
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}>
            <div className="fight-challenge">{fight.challenge}</div>
            <div className="fight-responses">
              <div className="fight-response">
                <div className="fight-name" style={{ color: f1.color }}>{f1.name}</div>
                <p className="fight-text">{revealed1}<span style={{ opacity: 0.4 }}>|</span></p>
                <div className="fight-votes" style={{ color: f1.color }}>{displayVotes1}</div>
              </div>
              <div className="fight-vs">VS</div>
              <div className="fight-response">
                <div className="fight-name" style={{ color: f2.color }}>{f2.name}</div>
                <p className="fight-text">{revealed2}<span style={{ opacity: 0.4 }}>|</span></p>
                <div className="fight-votes" style={{ color: f2.color }}>{displayVotes2}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aftermath overlay */}
      <AnimatePresence>
        {game.phase === 'aftermath' && game.lastWinner && game.lastLoser && game.lastFight && (
          <motion.div className="aftermath-panel"
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="aftermath-winner" style={{ color: game.lastWinner.color }}>
              {game.lastWinner.name} WINS
            </div>
            <div className="aftermath-detail">
              {game.lastLoser.name} took {game.lastFight.damage} damage
              {game.lastLoser.hp <= 0 ? ' \u2014 ELIMINATED' : ` (${game.lastLoser.hp} HP left)`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bloodline toggle */}
      <button className="bloodline-toggle" onClick={() => setShowBloodline(!showBloodline)}>
        {showBloodline ? 'HIDE' : 'BLOODLINE'}
      </button>
      <AnimatePresence>
        {showBloodline && (
          <motion.div className="bloodline-panel"
            initial={{ x: -180, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -180, opacity: 0 }}>
            <div style={{ fontSize: 9, color: '#8a7e7e', letterSpacing: 2, marginBottom: 8 }}>PHYLOGENY</div>
            {renderBloodlineTree()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ollama connect */}
      <button className="ollama-toggle" onClick={() => setShowOllama(!showOllama)}>
        + ADD FIGHTER
      </button>
      <AnimatePresence>
        {showOllama && (
          <motion.div className="ollama-modal"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ fontSize: 10, color: '#8a7e7e', letterSpacing: 2, marginBottom: 8 }}>PASTE OLLAMA ENDPOINT</div>
            <input
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              onKeyDown={(e) => e.key === 'Enter' && handleOllamaConnect()}
            />
            <button onClick={handleOllamaConnect}>ENTER THE ARENA</button>
            <div style={{ fontSize: 9, color: '#8a7e7e', marginTop: 8 }}>
              Your home rig gets a fighter card, a crowd chant, and enters the next bracket.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Death replay modal */}
      <AnimatePresence>
        {replayNode && (
          <motion.div className="death-replay"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <button className="death-replay-close" onClick={() => setDeathReplayId(null)}>X</button>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: replayNode.color, marginBottom: 8 }}>
              {replayNode.name}
            </div>
            <div style={{ fontSize: 11, color: '#8a7e7e', marginBottom: 4 }}>
              Generation {replayNode.generation} &middot; Died round {replayNode.deathRound}
            </div>
            <div style={{ fontSize: 12, color: '#e8e0e0', marginBottom: 4 }}>
              {replayNode.deathFightChallenge || 'Unknown cause of death'}
            </div>
            <div style={{ fontSize: 11, color: '#dc2626' }}>
              Killed by: {replayNode.deathFightWinner || 'Unknown'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roster */}
      <div className="roster">
        {game.gladiators.filter((g) => g.alive).slice(0, 10).map((g) => (
          <div key={g.id} className="roster-item" style={{ borderColor: g.color }}>
            <span style={{ color: g.color, minWidth: 80 }}>{g.name}</span>
            <div className="roster-hp" style={{ background: g.color, width: `${Math.max(0, g.hp)}%` }} />
            <span className="roster-stats">W{g.wins} L{g.losses}{g.debuffRounds > 0 ? ' \u2620' : ''}</span>
          </div>
        ))}
      </div>

      {/* God action log */}
      {game.godActions.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, color: '#8a7e7e', letterSpacing: 1, textAlign: 'center', zIndex: 5,
          pointerEvents: 'none',
        }}>
          {game.godActions.slice(-3).map((a, i) => (
            <div key={i}>{a.result}</div>
          ))}
        </div>
      )}
    </div>
  );
}
