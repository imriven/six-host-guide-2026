"use client";
import { useMemo, useState } from "react";
import { fullDescriptions } from "./fullDescriptions";
import RunOfShow from "./RunOfShow";
type S = "Released" | "Not yet released";
type G = {
  t: string;
  d: string;
  p: string[];
  s: S;
  n: string;
  l: string;
  online?: boolean;
  u?: string;
  slug: string;
  r: string;
  demo: string;
};
const rows: [string, string, string, string, string, boolean?, string?][] = [
  [
    "Ascent Rivals",
    "GENUN Games",
    "PC, Steam",
    "Verify status",
    "Competitive multiplayer racing blending driving, combat, ship upgrades, and four tactical heats.",
  ],
  [
    "Breach Of Contract",
    "Fern Sprout Studios",
    "PC",
    "Verify status",
    "Fast tactical action: plan each breach, wield eldritch powers, and eliminate enemies to recharge.",
  ],
  [
    "BroomSweeper",
    "BandWidth Games",
    "PC, Steam",
    "Released",
    "Minesweeper gone roguelike, with 150+ items, dust bunnies, and 16 floors of janitorial danger.",
    false,
    "https://store.steampowered.com/app/3473250/BroomSweeper/",
  ],
  [
    "Cooking Fist",
    "Spaghetti Code LLC",
    "PC",
    "Verify status",
    "A cooking fighting game with no health bars—fight for ingredients, pause to cook, and win by making the most food.",
  ],
  [
    "Creature Kitchen",
    "The Rat Zone",
    "PC, Steam",
    "Released",
    "A creepy-cozy cooking simulator about exploring a strange house and feeding local wildlife.",
    false,
    "https://store.steampowered.com/app/3097300/Creature_Kitchen/",
  ],
  [
    "Desolus",
    "Mark J. Mayers",
    "PC, Steam, PS5, Switch 2, Xbox Series",
    "Upcoming",
    "A Gothic first-person puzzle game about black holes, impossible architecture, and rebuilding a city across time.",
    false,
    "https://www.desolus.com",
  ],
  [
    "Diabolocracy",
    "Chaos Gremlin Games",
    "PC, Steam",
    "Upcoming",
    "Hellish corporate politics become a roguelite turn-based tactics game starring a team of Sins.",
    false,
    "https://store.steampowered.com/app/4143850/Diabolocracy/",
  ],
  [
    "Dig Too Deep",
    "Punch Up Games",
    "PC, Steam",
    "Verify status",
    "Throw goblins at every problem in an action tower-defense roguelite where minions are also ammunition.",
  ],
  [
    "Dittori",
    "Blookerstein",
    "PC, Steam",
    "Verify status",
    "A reality-breaking game with 200+ puzzles built around splitting objects into two linked copies.",
  ],
  [
    "Dungeon Bodega Simulator",
    "Alien Fruit Games",
    "PC, Linux, Steam",
    "Verify status",
    "Grow crops, brew potions, forge weapons, serve customers, and investigate a dungeon mystery.",
  ],
  [
    "End of Garbage",
    "Joshua Rosen (Rakelock LLC)",
    "PC, Mac, Steam",
    "Verify status",
    "A short first-person puzzle game about the dark surreality of endings, documents, bodies, and deduction.",
  ],
  [
    "Fairy Circle",
    "Play Hooky",
    "PC, Steam",
    "Verify status",
    "A bag-building roguelike where a Forest Keeper protects a fairytale home from the Gloom.",
  ],
  [
    "Feeding Gooble",
    "Displacer Labs",
    "PC",
    "Verify status",
    "A conveyor-belt roguelite about keeping Gooble fed while lab experiments complicate the test forever.",
  ],
  [
    "Gravity Goblins",
    "The Rat Zone",
    "PC, Steam",
    "Verify status",
    "A gravity-bending roguelite collectathon through an ever-shifting tower packed with coins and trinkets.",
  ],
  [
    "Hamsteria",
    "2WheelerDev",
    "PC, Linux, Steam",
    "Verify status",
    "A difficult two-player co-op game starring hamsters in attached wheels, with online, local, and solo play.",
  ],
  [
    "Haunted Heist",
    "autotroph games",
    "PC, Linux, Steam",
    "Verify status",
    "A 3–10 player PvP horror party game: heisters steal gems while tricksters weaponize a procedural mansion.",
  ],
  [
    "Hogen",
    "Scrappyard Games",
    "PC, Steam",
    "Verify status",
    "A grid-based card battler where you face Death, craft powerful builds, and uncover what lies behind the game.",
  ],
  [
    "HYPERFIST",
    "Chirality",
    "PC, Steam",
    "Verify status",
    "Comic-styled first-person action focused on fast, fluid punching, grabbing, and mecha-fist combat.",
  ],
  [
    "Killing Baby Hitler",
    "The Coffee Industrial Complex",
    "PC, Steam",
    "Verify status",
    "A retro FPS through corrupted timelines using resistance art, grenades, dinosaurs, and a wicked guitar.",
  ],
  [
    "Knockout 2: Wrath of the Karen",
    "ExceptioNULL Games",
    "PC, Steam, Mobile",
    "Verify status",
    "A comedic boxing adventure where the Federal Boxing Investigations settles every argument in the ring.",
  ],
  [
    "Malice In Wonderland",
    "Slyglass Games",
    "PC",
    "Verify status",
    "A fast action roguelike based on the original Wonderland stories, where time itself is your health.",
  ],
  [
    "Manafinder II",
    "Wolfsden LLC",
    "PC",
    "Verify status",
    "A console-style turn-based RPG emphasizing party roles, weapon choices, and elemental affinities.",
  ],
  [
    "MYRIORAMA",
    "J&K Games",
    "PC",
    "Verify status",
    "A stop-motion-styled top-down adventure where players rearrange dungeon rooms to solve puzzles.",
  ],
  [
    "Nightmare Kitchen",
    "Byteback Studios",
    "PC",
    "Verify status",
    "A co-op FPS roguelite where chefs fight monstrous food with ridiculous culinary weapons.",
  ],
  [
    "Nimbit Frontier",
    "Megasploot",
    "PC, Steam",
    "Verify status",
    "A cozy creature-collecting life sim with detailed care, custom habitats, conservation, and roguelite expeditions.",
  ],
  [
    "RUNE GUNNER",
    "False Summit",
    "PC, Steam",
    "Verify status",
    "A 1–4 player co-op roguelite shooter where guns and magic fuse into chaotic, build-breaking runs.",
  ],
  [
    "SCP: Antimemetics Division",
    "Quadrant Five",
    "PC, Steam",
    "Verify status",
    "Tactile survival horror inside a locked-down SCP site where memory and reality are dangerous resources.",
  ],
  [
    "Seedborne Soldiers",
    "Hat Wobble Games",
    "PC, Steam",
    "Verify status",
    "An auto-battler roguelike about growing heroes across time and space and assembling wild synergies.",
  ],
  [
    "Shroomwood",
    "Sporelite Games",
    "PC, Mac, Linux, Steam",
    "Verify status",
    "Play a tiny mushroom warrior in a transforming wilderness, mixing melee and ranged weapons.",
  ],
  [
    "Steel Swarm: SURVIVOR",
    "Clay Token Game Studio, Inc.",
    "PC, Linux, Steam",
    "Verify status",
    "A fast survivors-like where customizable drone formations overwhelm metal hordes solo or in co-op.",
  ],
  [
    "Super Choppy",
    "Sumoshell Bombfunk",
    "PC, Mac, Linux, Steam",
    "Verify status",
    "A pixel-art action platformer where Choppy uses an axe to throw, fly, climb, and chop.",
  ],
  [
    "Telera",
    "Entropico",
    "PC, Steam",
    "Verify status",
    "A roguelike dice-builder about rolling, scoring, upgrading, combining magic items, and out-thinking luck.",
  ],
  [
    "The Assessment",
    "Miga Games",
    "PC, Steam",
    "Verify status",
    "An archaeologist explores a forgotten castle, performs rituals, releases souls, and confronts corrupted memories.",
  ],
  [
    "TileShire",
    "Boss Blob",
    "PC, Mac, Steam",
    "Verify status",
    "A minimalist townbuilder where placing and transforming tiles earns points, cards, and townsfolk.",
  ],
  [
    "Tower Lab",
    "Play Tug Studio",
    "PC, Steam",
    "Verify status",
    "A physics tower-defense roguelite: shrink, grow, split, and clone objects to push enemies away.",
  ],
  [
    "Tricky and the Dream Caster",
    "PossQueen",
    "PC, Steam",
    "Verify status",
    "A colorful platforming adventure starring Tricky O’Possum and Volt the Mouse on a wizard-punching mission.",
  ],
  [
    "Turning Manor",
    "Sabbatical Games",
    "PC, Steam",
    "Verify status",
    "An anomaly-spotting horror game with no resets, more lore, and leaderboards inside a suspicious workplace.",
  ],
  [
    "We Need An Army",
    "Elder Bear Games",
    "PC, Steam",
    "Verify status",
    "A tactical slots-based roguelike battler about collecting units, finding relics, and shuffling an army.",
  ],
  [
    "WILL: Follow The Light",
    "TomorrowHead Studio",
    "PC, PlayStation, Steam",
    "Verify status",
    "A story-driven first-person adventure puzzle about sailing harsh northern waters to reunite with family.",
  ],
  [
    "Wrestle Story",
    "Tic Toc Games",
    "PC, Steam",
    "Verify status",
    "A smack-talking 3D wrestling RPG about creating a wrestler, building a tag team, and living the story.",
  ],
  [
    "Hit & Haunted",
    "Amnesiac Ghost",
    "PC, Steam",
    "Verify status",
    "A murder mystery where you play both the hitman and the victim’s ghost to uncover who ordered the hit.",
    true,
  ],
];
const release: Record<string, [string, string]> = {
  "Ascent Rivals": ["Q4 2026", "No public demo listed"],
  "Breach Of Contract": [
    "Public beta released June 20, 2026",
    "Free beta on itch.io",
  ],
  BroomSweeper: ["January 19, 2026", "Demo available on Steam"],
  "Cooking Fist": ["To be announced", "No public demo listed"],
  "Creature Kitchen": ["February 6, 2026", "Demo available on Steam and itch.io"],
  Desolus: ["Q3 2026 / Steam lists coming soon", "Demo available on Steam and Xbox"],
  Diabolocracy: ["2027", "No public demo listed"],
  "Dig Too Deep": ["2026", "Demo available on Steam"],
  Dittori: ["To be announced", "Demo available on Steam"],
  "Dungeon Bodega Simulator": ["March 23, 2026", "Demo available on Steam"],
  "End of Garbage": ["March 13, 2026", "Demo available on Steam"],
  "Fairy Circle": ["March 26, 2026", "Demo available on Steam"],
  "Feeding Gooble": ["In development", "No public download confirmed"],
  "Gravity Goblins": ["2027", "No public demo listed"],
  Hamsteria: ["Q1 2027", "Demo available on Steam"],
  "Haunted Heist": ["October 12, 2026", "No public demo listed"],
  Hogen: ["April 2, 2025", "Demo available on Steam"],
  HYPERFIST: ["July 10, 2026", "No public demo listed"],
  "Killing Baby Hitler": ["2027", "Demo available on Steam and itch.io"],
  "Knockout 2: Wrath of the Karen": [
    "April 9, 2026",
    "Demo available on Steam and mobile",
  ],
  "Malice In Wonderland": ["To be announced", "Demo available on Steam"],
  "Manafinder II": ["Q1 2027", "No public demo listed"],
  MYRIORAMA: ["Coming soon", "No public demo listed"],
  "Nightmare Kitchen": ["To be announced", "No public demo listed"],
  "Nimbit Frontier": ["August 17, 2026", "Demo available on Steam"],
  "RUNE GUNNER": ["Q1 2027", "No public demo listed"],
  "SCP: Antimemetics Division": [
    "September 15, 2026",
    "Demo available on Steam",
  ],
  "Seedborne Soldiers": ["June 1, 2026", "Demo available on Steam"],
  Shroomwood: ["2026", "Demo and playtest available on Steam"],
  "Steel Swarm: SURVIVOR": ["Coming soon", "Demo available on Steam and itch.io"],
  "Super Choppy": ["To be announced", "Demo available on Steam and itch.io"],
  Telera: ["2026", "Demo available on Steam"],
  "The Assessment": ["Q4 2026", "No public demo listed"],
  TileShire: ["2026", "No public demo listed"],
  "Tower Lab": ["September 7, 2026", "No public demo listed"],
  "Tricky and the Dream Caster": ["Q4 2027", "Demo available on Steam"],
  "Turning Manor": ["2026", "Demo available on Steam and itch.io"],
  "We Need An Army": ["Q4 2026", "No public demo listed"],
  "WILL: Follow The Light": ["May 7, 2026", "Demo available on Steam"],
  "Wrestle Story": ["To be announced", "No public demo listed"],
  "Hit & Haunted": ["To be announced", "Demo available on Steam"],
};
const released = new Set([
  "Breach Of Contract",
  "BroomSweeper",
  "Creature Kitchen",
  "Dungeon Bodega Simulator",
  "End of Garbage",
  "Fairy Circle",
  "Hogen",
  "HYPERFIST",
  "Knockout 2: Wrath of the Karen",
  "Nimbit Frontier",
  "Seedborne Soldiers",
  "WILL: Follow The Light",
]);
const mediaSlug: Record<string, string> = {
  Shroomwood: "Martin%20Hundrup",
  "WILL: Follow The Light": "Roman%20Novikov",
};
const mediaFolder: Record<string, string> = {
  Shroomwood: "Martin%20Hundrup",
  "WILL: Follow The Light": "Roman%20Novikov",
};
const videoIds: Record<string, string> = {
  "Ascent Rivals":"lQkBSUMFlnk","Breach Of Contract":"D8xRftvI5iU",BroomSweeper:"JCCfUywh9iY","Cooking Fist":"oxuyE_pWvXw","Creature Kitchen":"3U8V5RcFSqs",Desolus:"HxfV0AvwSIs",Diabolocracy:"xdvk8IQBGWI","Dig Too Deep":"JSwNG2A444M",Dittori:"0xXuZZ7F8Vs","Dungeon Bodega Simulator":"Hpbdtqusk3c","End of Garbage":"Eh56--dqBK4","Fairy Circle":"_QT6JHIRf1w","Feeding Gooble":"za-kJSvx9vA","Gravity Goblins":"IUN1QLruuJ8",Hamsteria:"8wjcCM3xKQM","Haunted Heist":"QM9Ztbm9EjQ",Hogen:"gGKx2EghID8",HYPERFIST:"m-P1E2uCtbM","Killing Baby Hitler":"p2ENhCALff0","Knockout 2: Wrath of the Karen":"7qiAh0rK458","Malice In Wonderland":"PYI_usmMim8","Manafinder II":"uR8CokKtDYw",MYRIORAMA:"ubZqNnt4tlo","Nightmare Kitchen":"VVkEj57OxVc","Nimbit Frontier":"YJxnDCrTqyM","RUNE GUNNER":"AdDfigLpSjg","SCP: Antimemetics Division":"3ENXLCf6c2o","Seedborne Soldiers":"ejA_7I6fPTk",Shroomwood:"qZtAtZZIl_w","Steel Swarm: SURVIVOR":"poEK4BFvMYA","Super Choppy":"b6UtITtVuxk",Telera:"Qv9GY_9RpGo","The Assessment":"JR4hXyOlywQ",TileShire:"C1afDQkrrLg","Tower Lab":"FCEoowKglGA","Tricky and the Dream Caster":"nzQXQ_nIGFk","Turning Manor":"5JvE5PJ6-Bk","We Need An Army":"qagBhjgCvs0","WILL: Follow The Light":"I7Scpm5vRIU","Wrestle Story":"Pbii7_HpooQ","Hit & Haunted":"eRlyPFMJ1qs"
};
const steamIds: Record<string, string> = {
  "Ascent Rivals":"2748420",BroomSweeper:"3473250","Cooking Fist":"3941360","Creature Kitchen":"3097300",Desolus:"1003460",Diabolocracy:"4143850","Dig Too Deep":"4280850",Dittori:"4311980","Dungeon Bodega Simulator":"3458180","End of Garbage":"4256210","Fairy Circle":"3962850","Gravity Goblins":"4102030",Hamsteria:"4430020","Haunted Heist":"4024440",Hogen:"3575520",HYPERFIST:"3689210","Killing Baby Hitler":"3317230","Knockout 2: Wrath of the Karen":"2349350","Malice In Wonderland":"4552140","Manafinder II":"4568010",MYRIORAMA:"4663150","Nightmare Kitchen":"3077140","Nimbit Frontier":"2477710","RUNE GUNNER":"3769870","SCP: Antimemetics Division":"4385740","Seedborne Soldiers":"3039930",Shroomwood:"3504020","Steel Swarm: SURVIVOR":"4307100","Super Choppy":"3616860",Telera:"4079370","The Assessment":"4081850",TileShire:"4370780","Tower Lab":"3084810","Tricky and the Dream Caster":"3564580","Turning Manor":"3855530","We Need An Army":"3671320","WILL: Follow The Light":"3144860","Wrestle Story":"2357610","Hit & Haunted":"3574060"
};
const cleanPlatforms = (title: string, platforms: string) => {
  if (title === "Breach Of Contract" || title === "Feeding Gooble") return ["itch.io"];
  const labels = new Set<string>();
  const items = platforms.split(", ");
  if (items.includes("Steam") || steamIds[title]) labels.add("Steam");
  if (items.includes("Mobile")) labels.add("Mobile");
  if (items.some((x) => x === "PS5" || x === "PlayStation")) labels.add("PlayStation");
  if (items.some((x) => x === "Xbox Series" || x === "Xbox")) labels.add("Xbox");
  if (items.some((x) => x === "Switch 2" || x === "Switch")) labels.add("Switch");
  return Array.from(labels);
};
const games: G[] = rows.map(([t, d, p, _s, n, online, u]) => {
  const [r, demo] = release[t] ?? ["In development", "Not confirmed"];
  return {
    t,
    d,
    p: cleanPlatforms(t, p),
    s: released.has(t) ? "Released" : "Not yet released",
    n,
    l: fullDescriptions[t] ?? n,
    online,
    u,
    slug: mediaSlug[t] ?? t.toLowerCase().replace(/[^a-z0-9]+/g, ""),
    r,
    demo,
  };
});
const art = (g: G) =>
  `https://firebasestorage.googleapis.com/v0/b/seattle-indies-expo.appspot.com/o/2026%2F${g.slug}%2Flogo?alt=media`;
export default function Home() {
  const [page, setPage] = useState<"guide" | "run">("guide");
  const [q, setQ] = useState("");
  const [p, setP] = useState("All");
  const [s, setS] = useState("All");
  const [sel, setSel] = useState<number | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const ps = ["All", ...Array.from(new Set(games.flatMap((g) => g.p)))];
  const shown = useMemo(
    () =>
      games.filter(
        (g) =>
          (!q ||
            `${g.t} ${g.d} ${g.n}`.toLowerCase().includes(q.toLowerCase())) &&
          (p === "All" || g.p.includes(p)) &&
          (s === "All" || g.s === s),
      ),
    [q, p, s],
  );
  const active = sel === null ? null : games[sel];
  const letters = Array.from(new Set(games.map((g) => g.t[0].toUpperCase())));
  const move = (d: number) =>
    sel !== null && (setMediaIndex(0), setSel((sel + d + games.length) % games.length));
  const activeMedia = active ? [
    {type:"video",src:`https://www.youtube.com/embed/${videoIds[active.t]}?rel=0`},
    ...[0,1].map((i)=>({type:"image",src:`https://firebasestorage.googleapis.com/v0/b/seattle-indies-expo.appspot.com/o/2026%2F${mediaFolder[active.t] ?? active.t.toLowerCase().replace(/[^a-z0-9]+/g,"")}%2Fscreenshots-${i}?alt=media`}))
  ] : [];
  const openGame = (index: number) => {
    setPage("guide");
    setMediaIndex(0);
    setSel(index);
  };
  return (
    <main>
      <nav className="siteNav" aria-label="Host tools">
        <button className={page === "guide" ? "active" : ""} onClick={() => setPage("guide")}>Game Guide</button>
        <button className={page === "run" ? "active" : ""} onClick={() => setPage("run")}>Run of Show</button>
      </nav>
      {page === "run" ? <RunOfShow games={games} onOpenGame={openGame} /> : <>
      <header className="hero">
        <div className="kicker">Seattle Indies Expo · 2026</div>
        <h1>
          Seattle Indies Expo<br/><em>2026 Host Field Guide</em>
        </h1>
        <p>
          Searchable, swipeable notes for hosts, producers, and anyone who needs
          the lineup in their pocket. Mobile-friendly.
        </p>
        <div className="meta"><span>Updated August 21, 2026</span></div>
      </header>
      <nav className="az" aria-label="Game index">
        <b>Quick index</b>
        {letters.map((letter) => (
          <a key={letter} href={`#letter-${letter}`}>{letter}</a>
        ))}
        <a className="download" href="/SIX-2026-Game-Guide.pdf" target="_blank" rel="noreferrer">Open PDF ↗</a>
        <a className="download" href="/SIX-2026-Game-Guide.docx" download>DOCX ↓</a>
      </nav>
      <section className="toolbar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games, studios, or keywords"
          aria-label="Search games"
        />
        <select value={p} onChange={(e) => setP(e.target.value)}>
          {ps.map((x) => (
            <option key={x} value={x}>{x === "All" ? "Platform" : x}</option>
          ))}
        </select>
        <select value={s} onChange={(e) => setS(e.target.value)}>
          <option value="All">Availability</option>
          <option>Released</option>
          <option>Not yet released</option>
        </select>
        <button className="printView" onClick={() => window.print()}>Print this view</button>
      </section>
      <div className="results">
        <b>{shown.length}</b> games shown · <b>Released</b> means the full game is
        available. <b>Not yet released</b> means the full game is still forthcoming;
        demos, betas, and playtests are listed separately on each card.
      </div>
      <section className="grid">
        {shown.map((g, i) => (
          <button
            id={`letter-${g.t[0].toUpperCase()}`}
            className="card"
            key={g.t}
            onClick={() => { setMediaIndex(0); setSel(games.indexOf(g)); }}
          >
            <div className="art">
              <img src={art(g)} alt="" loading={i < 8 ? "eager" : "lazy"} />
              <span className={`badge ${g.s === "Released" ? "released" : "notyetreleased"}`}>
                {g.s}
              </span>
            </div>
            <div className="body">
              <div className="num">
                {String(games.indexOf(g) + 1).padStart(2, "0")}
              </div>
              <h2>{g.t}</h2>
              <p className="dev">{g.d}</p>
              <div className="chips">
                {g.p.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
              <dl>
                <div><dt>Release</dt><dd>{g.r}</dd></div>
                <div><dt>Demo</dt><dd className={g.demo.includes("Demo available") ? "demoYes" : ""}>{g.demo}</dd></div>
              </dl>
              <p>{g.n}</p>
              <b className="more">Open host card →</b>
            </div>
          </button>
        ))}
      </section>
      {active && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setSel(null)}
        >
          <article onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSel(null)}>
              ×
            </button>
            <div className="mediaViewer">
              {activeMedia[mediaIndex]?.type === "video" ? <iframe src={activeMedia[mediaIndex].src} title={`${active.t} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/> : <img src={activeMedia[mediaIndex]?.src} alt={`${active.t} screenshot ${mediaIndex}`} />}
              <div className="mediaTabs">
                <button className={mediaIndex===0?"active":""} onClick={()=>setMediaIndex(0)}>▶ Trailer</button>
                <button className={mediaIndex===1?"active":""} onClick={()=>setMediaIndex(1)}>Screenshot 1</button>
                <button className={mediaIndex===2?"active":""} onClick={()=>setMediaIndex(2)}>Screenshot 2</button>
              </div>
            </div>
            <div className="modalBody">
              <div className="kicker">
                Game {sel! + 1} of {games.length}
              </div>
              <h2>{active.t}</h2>
              <h3>{active.d}</h3>
              <div className="chips">
                {active.p.map((x) => (
                  <span key={x}>{x}</span>
                ))}
                <span className={`statusChip ${active.s === "Released" ? "released" : "notyetreleased"}`}>{active.s}</span>
              </div>
              <dl>
                <div><dt>Release</dt><dd>{active.r}</dd></div>
                <div><dt>Demo / build</dt><dd className={active.demo.includes("Demo available") ? "demoYes" : ""}>{active.demo}</dd></div>
              </dl>
              <div className="descriptionBlock">
                <h4>Quick overview</h4>
                <p>{active.n}</p>
                <h4>Full description</h4>
                <p>{active.l}</p>
              </div>
              <div className="actions">
                <button onClick={() => move(-1)}>← Previous</button>
                {active.u && (
                  <a href={active.u} target="_blank">
                    Official page ↗
                  </a>
                )}
                {steamIds[active.t] && <a href={`https://store.steampowered.com/app/${steamIds[active.t]}/`} target="_blank" rel="noreferrer">Steam page ↗</a>}
                <button onClick={() => move(1)}>Next →</button>
              </div>
            </div>
          </article>
        </div>
      )}
      <footer>
        Source: Seattle Indies Expo 2026 lineup and linked official storefronts.
        Availability can change; checked August 21, 2026.
      </footer>
      </>}
    </main>
  );
}
