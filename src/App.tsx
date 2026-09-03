
import { useEffect, useMemo, useState } from "react";
import { games, type Game } from "./data";
import RunOfShow from "./RunOfShow";
const art = (game: Game) =>
  `https://firebasestorage.googleapis.com/v0/b/seattle-indies-expo.appspot.com/o/2026%2F${game.slug}%2Flogo?alt=media`;
export default function Home() {
  const pageFromPath = () => window.location.pathname.replace(/\/$/, "") === "/run-of-show" ? "run" as const : "guide" as const;
  const [page, setPage] = useState<"guide" | "run">(pageFromPath);
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
    {type:"video",src:`https://www.youtube.com/embed/${active.videoId}?rel=0`},
    ...[0,1].map((i)=>({type:"image",src:`https://firebasestorage.googleapis.com/v0/b/seattle-indies-expo.appspot.com/o/2026%2F${active.mediaFolder}%2Fscreenshots-${i}?alt=media`}))
  ] : [];
  useEffect(() => {
    const syncPage = () => setPage(pageFromPath());
    window.addEventListener("popstate", syncPage);
    return () => window.removeEventListener("popstate", syncPage);
  }, []);
  const navigate = (destination: "guide" | "run") => {
    const path = destination === "run" ? "/run-of-show" : "/";
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setPage(destination);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openGame = (index: number) => {
    navigate("guide");
    setMediaIndex(0);
    setSel(index);
  };
  return (
    <main>
      <nav className="siteNav" aria-label="Host tools">
        <button className={page === "guide" ? "active" : ""} onClick={() => navigate("guide")}>Game Guide</button>
        <button className={page === "run" ? "active" : ""} onClick={() => navigate("run")}>Run of Show</button>
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
                {active.steamId && <a href={`https://store.steampowered.com/app/${active.steamId}/`} target="_blank" rel="noreferrer">Steam page ↗</a>}
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
