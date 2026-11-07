// Fisica del fuoristrada con Rapier: telaio, ponti rigidi, ruote vere (cilindri), differenziali.
// Funziona sia nel browser sia in node (per i test automatici).
export function makeSim(R, opt = {}) {
  const world = new R.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / 120;
  world.numSolverIterations = 8;
  const G_WORLD = 0x0001ffff, G_CAR = 0x00020001; // il mezzo tocca solo il mondo, non se stesso

  // ---------- percorso di prova ----------
  const W = 40, L = 220, DX = .5, nx = Math.round(W / DX) + 1, nz = Math.round(L / DX) + 1;
  const vn = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
  const noise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = vn(xi, zi), b = vn(xi + 1, zi), c = vn(xi, zi + 1), d = vn(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const OB = { log: 40, step: 70, step2: 74.5, twist: 96, ditch: 128, rocks: 145, climb: 172 };
  function ground(x, z) {
    const ax = Math.abs(x);
    let h = (noise(x * .35, z * .35) - .5) * .12 + (noise(x * .9 + 9, z * .9) - .5) * .05; // sterrato irregolare
    h += Math.max(0, ax - 4.2) * .55 + Math.max(0, ax - 8) * .9 + (noise(x * .08, z * .08) - .5) * Math.max(0, ax - 6) * .5; // sponde: si resta in pista
    h += z > 165 ? (z - 165) * .22 - Math.max(0, z - 192) * .22 : 0; // salita ripida in fondo
    // twist: buche e dossi alternati a destra e sinistra
    const T = [[0, -1.25, -1], [0, 1.25, 1], [4.2, 1.25, -1], [4.2, -1.25, 1], [8.4, -1.25, -1], [8.4, 1.25, 1], [12.6, 1.25, -1], [12.6, -1.25, 1]];
    for (const [u, d, sg] of T) { const q = Math.hypot((z - OB.twist - u) * .65, x - d); if (q < 1.6) { const c = Math.cos(q / 1.6 * Math.PI / 2); h += sg * .55 * c * c; } }
    // canale di scolo: fondo piatto, sponde ripide
    { const t = Math.abs(z - OB.ditch) / .85; if (t < 1) h -= .36 * (1 - ss(.5, 1, t)); }
    return h;
  }
  const heights = new Float32Array(nx * nz);
  // heightfield di Rapier: righe lungo X, colonne lungo Z, in colonna-maggiore
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) heights[i * nz + j] = ground(-W / 2 + i * DX, j * DX);
  const hfB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, 0, L / 2));
  const hf = world.createCollider(R.ColliderDesc.heightfield(nz - 1, nx - 1, heights, { x: W, y: 1, z: L }).setFriction(1.0).setCollisionGroups(G_WORLD), hfB);
  const statics = []; // per disegnarli
  const fixed = (desc, pos, rot, info) => { const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(rot || { x: 0, y: 0, z: 0, w: 1 })); world.createCollider(desc.setFriction(info && info.mu || 1.0).setCollisionGroups(G_WORLD), b); statics.push({ ...info, pos, rot: rot || { x: 0, y: 0, z: 0, w: 1 } }); };
  const qa = (ax, a) => { const s = Math.sin(a / 2); return { x: ax[0] * s, y: ax[1] * s, z: ax[2] * s, w: Math.cos(a / 2) }; };
  // tronco di traverso (un po' storto)
  { const r = .24, a = .12; fixed(R.ColliderDesc.cylinder(4.2, r), { x: 0, y: ground(0, OB.log) + r * .8, z: OB.log }, mulQ(qa([0, 1, 0], a), qa([0, 0, 1], Math.PI / 2)), { t: 'log', r, len: 8.4, a }); }
  // gradoni di roccia
  fixed(R.ColliderDesc.cuboid(4, .17, 2.4), { x: 0, y: ground(0, OB.step + 2.4) + .17 - .03, z: OB.step + 2.4 }, null, { t: 'step', hx: 4, hy: .17, hz: 2.4 });
  fixed(R.ColliderDesc.cuboid(4, .15, 1.8), { x: 0, y: ground(0, OB.step2 + 1.8) + .31 + .15 - .03, z: OB.step2 + 1.8 }, null, { t: 'step', hx: 4, hy: .15, hz: 1.8 });
  // pietraia: massi mezzi interrati
  { let k = 0; for (let z = OB.rocks; z < OB.rocks + 16; z += 1.6) for (let n = 0; n < 2; n++) { k++; const r = .25 + vn(k, 3) * .32, x = (vn(k, 7) - .5) * 5.6; fixed(R.ColliderDesc.ball(r), { x, y: ground(x, z) - r * .35, z: z + vn(k, 11) }, null, { t: 'rock', r }); } }

  // ---------- il fuoristrada ----------
  const V = Object.assign({ mass: 1750, rw: .38, ww: .27, track: 1.56, wb: 2.6, kF: 38000, kR: 46000, cF: 3800, cR: 4200, travel: [-.13, .16], tF: null, tR: null, rollF: .4, rollR: .4, lift: 1, solidF: false, Tlow: 10000, Thigh: 3000, wLow: 5.4, wHigh: 26 }, opt.veh || {});
  { const k = V.lift; V.tF = (V.tF || V.travel).map(v => v * k); V.tR = (V.tR || V.travel).map(v => v * k); V.rollF *= k; V.rollR *= k; if (k > 1) { V.kF /= Math.sqrt(k); V.kR /= Math.sqrt(k); } }
  const sagF = V.mass * .55 * 9.81 / 2 / V.kF, sagR = V.mass * .45 * 9.81 / 2 / V.kR; // precarico: a vuoto sta a metà corsa
  const START = opt.start || { x: 0, z: 8 };
  const y0 = ground(START.x, START.z) + V.rw + .55;
  const chassis = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(START.x, y0, START.z).setAdditionalMassProperties(V.mass, { x: 0, y: -.1, z: 0 }, { x: V.mass * (1.9 ** 2 + .9 ** 2) / 12 * 1.1, y: V.mass * (1.9 ** 2 + 4.3 ** 2) / 12, z: V.mass * (4.3 ** 2 + .9 ** 2) / 12 }, { x: 0, y: 0, z: 0, w: 1 }).setCanSleep(false).setAngularDamping(.15).setLinearDamping(.02));
  // scocca: sotto ha la "pancia" che gratta sugli ostacoli
  world.createCollider(R.ColliderDesc.cuboid(.86, .28, 2.05).setTranslation(0, .12, 0).setDensity(0).setFriction(.5).setCollisionGroups(G_CAR), chassis);
  world.createCollider(R.ColliderDesc.cuboid(.82, .28, 1.2).setTranslation(0, .66, -.2).setDensity(0).setFriction(.5).setCollisionGroups(G_CAR), chassis);
  const body = (pos, mass, coll) => { const b = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setAdditionalMassProperties(mass, { x: 0, y: 0, z: 0 }, { x: mass * .05, y: mass * .05, z: mass * .05 }, { x: 0, y: 0, z: 0, w: 1 }).setCanSleep(false)); if (coll) world.createCollider(coll.setDensity(0).setCollisionGroups(G_CAR), b); return b; };
  const J = (data, a, b) => world.createImpulseJoint(data, a, b, true);
  const v3 = (x, y, z) => ({ x, y, z });
  const wheels = [];
  const mkWheel = (parent, anchor, wpos, front, side) => {
    const w = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(wpos.x, wpos.y, wpos.z).setCanSleep(false).setAngularDamping(.05));
    const c = world.createCollider(R.ColliderDesc.roundCylinder(V.ww / 2 - .05, V.rw - .05, .05).setRotation(qa([0, 0, 1], Math.PI / 2)).setMass(32).setFriction(1.15).setCollisionGroups(G_CAR), w);
    const j = J(R.JointData.revolute(anchor, v3(0, 0, 0), v3(1, 0, 0)), parent, w);
    j.configureMotorModel(R.MotorModel.ForceBased);
    wheels.push({ b: w, j, front, side, c }); return w;
  };
  const yA = y0 - .45; // altezza dei mozzi
  const zF = START.z + V.wb / 2, zR = START.z - V.wb / 2, hx = V.track / 2;
  const susp = [];
  // posteriore: ponte rigido (slitta verticale + rollio)
  const mkAxle = (z, front) => {
    const sl = body(v3(START.x, yA, z), 20); const pj = J(R.JointData.prismatic(v3(0, yA - y0, z - START.z), v3(0, 0, 0), v3(0, 1, 0)), chassis, sl);
    const TT = front ? V.tF : V.tR; pj.setLimits(TT[0], TT[1]); pj.configureMotorModel(R.MotorModel.ForceBased); const k = front ? V.kF : V.kR, c = front ? V.cF : V.cR; pj.configureMotorPosition(-(front ? sagF : sagR) * .9, 2 * k, 2 * c);
    const ax = body(v3(START.x, yA, z), 75, R.ColliderDesc.cylinder(hx * .8, .07).setRotation(qa([0, 0, 1], Math.PI / 2)).setFriction(.4));
    const rj = J(R.JointData.revolute(v3(0, 0, 0), v3(0, 0, 0), v3(0, 0, 1)), sl, ax); { const rl = front ? V.rollF : V.rollR; rj.setLimits(-rl, rl); } rj.configureMotorModel(R.MotorModel.ForceBased); rj.configureMotorPosition(0, k * hx * hx * 2 * .55, c * hx * hx * 2 * .5);
    susp.push({ t: 'axle', front, pj, rj, ax, z });
    for (const sd of [-1, 1]) {
      if (front) { const kn = body(v3(START.x + sd * hx, yA, z), 12); const sj = J(R.JointData.revolute(v3(sd * hx, 0, 0), v3(0, 0, 0), v3(0, 1, 0)), ax, kn); sj.setLimits(-.62, .62); sj.configureMotorModel(R.MotorModel.ForceBased); susp.push({ t: 'steer', sj }); mkWheel(kn, v3(0, 0, 0), v3(START.x + sd * hx, yA, z), true, sd); }
      else mkWheel(ax, v3(sd * hx, 0, 0), v3(START.x + sd * hx, yA, z), false, sd);
    }
  };
  // anteriore indipendente (Terrano): ogni ruota ha la sua slitta e il suo snodo di sterzo
  const mkIFS = (z) => {
    for (const sd of [-1, 1]) {
      const sl = body(v3(START.x + sd * hx, yA, z), 18, R.ColliderDesc.ball(.12));
      const pj = J(R.JointData.prismatic(v3(sd * hx, yA - y0, z - START.z), v3(0, 0, 0), v3(0, 1, 0)), chassis, sl);
      pj.setLimits(V.tF[0], V.tF[1]); pj.configureMotorModel(R.MotorModel.ForceBased); pj.configureMotorPosition(-sagF * .9, V.kF, V.cF);
      const kn = body(v3(START.x + sd * hx, yA, z), 10);
      const sj = J(R.JointData.revolute(v3(0, 0, 0), v3(0, 0, 0), v3(0, 1, 0)), sl, kn); sj.setLimits(-.62, .62); sj.configureMotorModel(R.MotorModel.ForceBased);
      susp.push({ t: 'ifs', pj, sd, z }); susp.push({ t: 'steer', sj });
      mkWheel(kn, v3(0, 0, 0), v3(START.x + sd * hx, yA, z), true, sd);
    }
  };
  if (V.solidF) mkAxle(zF, true); else mkIFS(zF);
  mkAxle(zR, false);

  const st = { low: true, lockR: false, lockF: false, steer: 0, rpmK: 0, slip: [0, 0, 0, 0], time: 0, hits: 0 };
  function wheelSpin(w) { // velocità angolare intorno al proprio asse
    const r = w.b.rotation(), av = w.b.angvel(); const ax = rot(r, [1, 0, 0]); return av.x * ax[0] + av.y * ax[1] + av.z * ax[2];
  }
  function step(inp, dt) {
    const n = Math.max(1, Math.round(dt / world.timestep));
    // sterzo
    st.steer += (inp.steer * .6 - st.steer) * Math.min(1, dt * 6);
    for (const s of susp) if (s.t === 'steer') s.sj.configureMotorPosition(-st.steer, 60000, 2500);
    // trasmissione: 4x4 inserita con ripartitore bloccato, differenziali aperti o bloccati
    const T = (st.low ? V.Tlow : V.Thigh) * (inp.gas > 0 ? .45 + .55 * inp.gas : 0), wMax = st.low ? V.wLow : V.wHigh;
    const sp = wheels.map(wheelSpin), mean = sp.reduce((a, b) => a + b, 0) / 4;
    const tgt = (inp.rev ? -.6 : 1) * wMax * (.2 + .8 * Math.max(0, inp.gas)); // il pedale chiede giri: più gas, più velocità
    for (const [a, b, lk] of [[0, 1, st.lockF], [2, 3, st.lockR]]) {
      let f = T / 4;
      if (!lk) { const d = Math.abs(sp[a] - sp[b]); f *= Math.max(.06, Math.min(1, 1 - (d - 1.2) / 3.5)); } // differenziale aperto: la ruota che gira a vuoto si mangia la coppia
      for (const i of [a, b]) {
        const w = wheels[i];
        if (inp.brk > 0) { w.j.configureMotorVelocity(0, 1e5); w.j.setMotorMaxForce(3200 * inp.brk); }
        else if (T > 0) { w.j.configureMotorVelocity(tgt, 1e5); w.j.setMotorMaxForce(f * (lk ? 1.8 : 1)); /* bloccato: ogni ruota può prendersi quasi tutta la coppia dell'asse */ }
        else { w.j.configureMotorVelocity(0, 1e5); w.j.setMotorMaxForce(st.low ? 900 : 120); } // freno motore: in ridotte trattiene
        st.slip[i] = Math.min(1, Math.abs(Math.abs(sp[i]) - Math.abs(mean)) / 4);
      }
    }
    // ripartitore bloccato: i due ponti tirano alla stessa velocità
    for (let k = 0; k < n; k++) world.step();
    st.time += dt;
    st.rpmK = Math.min(1, Math.abs(mean) / wMax);
  }
  function rot(q, v) { const [x, y, z] = v, { x: qx, y: qy, z: qz, w: qw } = q; const ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z; return [ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx]; }
  function mulQ(a, b) { return { x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y, y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x, z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w, w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z }; }
  function info() { const p = chassis.translation(), q = chassis.rotation(), v = chassis.linvel(); const up = rot(q, [0, 1, 0]), fw = rot(q, [0, 0, 1]); return { p, q, v, up, fw, kmh: Math.hypot(v.x, v.z) * 3.6, z: p.z }; }
  return { R, world, chassis, wheels, susp, st, step, info, ground, OB, W, L, statics, rot, V };
}
function mulQ(a, b) { return { x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y, y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x, z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w, w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z }; }
