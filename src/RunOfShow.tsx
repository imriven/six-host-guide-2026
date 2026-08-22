import { useEffect, useMemo, useState } from "react";

export type RunGame = { t: string; d: string; n: string };

type Props = {
  games: RunGame[];
  onOpenGame: (index: number) => void;
};

type ScheduleItem = {
  id: string;
  kind: "intro" | "game" | "ad" | "transition" | "closing";
  start: Date;
  end: Date;
  gameIndex?: number;
  hosts: string;
  segmentNumber?: number;
  title: string;
};

const config = {
  startHour: 10,
  startMinute: 0,
  introMinutes: 5,
  interviewMinutes: 6,
  transitionMinutes: 2,
  adMinutes: 2,
  closingMinutes: 5,
  hostPairs: ["A & B", "B & C", "C & D", "D & E", "E & F", "F & A"],
};

const atMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);
const fmt = (date: Date) => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function makeSchedule(games: RunGame[], day: Date): ScheduleItem[] {
  let cursor = new Date(day);
  cursor.setHours(config.startHour, config.startMinute, 0, 0);
  let nextAd = new Date(cursor);
  nextAd.setHours(cursor.getHours() + 1, 0, 0, 0);
  const items: ScheduleItem[] = [];

  let end = atMinutes(cursor, config.introMinutes);
  items.push({ id: "intro", kind: "intro", start: cursor, end, hosts: "A & B", segmentNumber: 1, title: "Opening / Welcome to SIX 2026" });
  cursor = end;
  end = atMinutes(cursor, config.transitionMinutes);
  items.push({ id: "transition-intro", kind: "transition", start: cursor, end, hosts: "-", title: "Break / Transition" });
  cursor = end;

  games.forEach((game, gameIndex) => {
    const hosts = config.hostPairs[(gameIndex + 1) % config.hostPairs.length];
    const segmentNumber = gameIndex + 2;
    end = atMinutes(cursor, config.interviewMinutes);
    items.push({
      id: `segment-${segmentNumber}`,
      kind: "game",
      start: cursor,
      end,
      gameIndex,
      hosts,
      segmentNumber,
      title: game.t,
    });
    cursor = end;

    if (cursor >= nextAd) {
      end = atMinutes(cursor, config.adMinutes);
      items.push({ id: `ad-${gameIndex}`, kind: "ad", start: cursor, end, hosts, title: "Seattle Indies / Sponsor Ad Read" });
      cursor = end;
      while (nextAd <= cursor) {
        nextAd = new Date(nextAd);
        nextAd.setHours(nextAd.getHours() + 1);
      }
    }

    end = atMinutes(cursor, config.transitionMinutes);
    items.push({ id: `transition-${gameIndex}`, kind: "transition", start: cursor, end, hosts: "-", title: "Break / Transition" });
    cursor = end;
  });

  end = atMinutes(cursor, config.closingMinutes);
  items.push({ id: "closing", kind: "closing", start: cursor, end, hosts: "A & B", segmentNumber: 43, title: "Closing / Thank You" });
  return items;
}

export default function RunOfShow({ games, onOpenGame }: Props) {
  const [now, setNow] = useState(new Date());
  const [manualId, setManualId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const schedule = useMemo(() => makeSchedule(games, now), [games, now.toDateString()]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const clockActive = schedule.find((item) => now >= item.start && now < item.end)?.id ?? null;
  const activeId = manualId ?? clockActive;
  const activeIndex = schedule.findIndex((item) => item.id === activeId);
  const active = activeIndex >= 0 ? schedule[activeIndex] : null;
  const next = activeIndex >= 0 ? schedule[activeIndex + 1] : schedule.find((item) => item.start > now);

  const jumpToNow = () => {
    setManualId(null);
    window.setTimeout(() => document.getElementById(clockActive ?? schedule[0]?.id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };

  return (
    <section className="rosPage">
      <header className="rosHero">
        <div className="kicker">Seattle Indies Expo · 2026</div>
        <h1>Run of <em>Show</em></h1>
        <p>Mobile production timeline with automatic “Now” and “Up Next” highlighting. Rough draft.</p>
        <div className="rosActions">
          <button onClick={jumpToNow}>Jump to now</button>
          <a href="/SIX-2026-Run-of-Show.pdf" target="_blank" rel="noreferrer">Open PDF ↗</a>
          <a href="/SIX-2026-Run-of-Show.docx" download>DOCX ↓</a>
          <a href="/SIX-2026-Run-of-Show.xlsx" download>Spreadsheet ↓</a>
        </div>
      </header>

      <aside className="nowPanel">
        <div><span>Now</span><strong>{active?.title ?? "Schedule not currently live"}</strong></div>
        <div><span>Up next</span><strong>{next?.title ?? "End of show"}</strong></div>
        {manualId && <button onClick={jumpToNow}>Resume automatic timing</button>}
      </aside>

      <div className="scheduleNote">
        <b>Host A = TBD</b> · Host B = TBD · Host C = TBD · Host D = TBD · Host E = TBD · Host F = TBD
      </div>

      <div className="timeline">
        {schedule.map((item, index) => {
          const game = item.gameIndex === undefined ? null : games[item.gameIndex];
          const nextGameItem = item.kind === "game"
            ? schedule.slice(index + 1).find((candidate) => candidate.kind === "game")
            : undefined;
          const nextGame = nextGameItem?.gameIndex === undefined ? null : games[nextGameItem.gameIndex];
          const isActive = item.id === activeId;
          const isNext = next?.id === item.id;
          const past = !manualId && item.end <= now;
          return (
            <article id={item.id} key={item.id} className={`segment ${item.kind} ${isActive ? "activeSegment" : ""} ${isNext ? "nextSegment" : ""} ${past ? "pastSegment" : ""}`}>
              <button className="segmentSummary" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                <span className="segmentTime">{fmt(item.start)}<small>– {fmt(item.end)}</small></span>
                <span className="segmentMain">
                  <small>{item.segmentNumber ? `Segment ${String(item.segmentNumber).padStart(2, "0")} · Hosts ${item.hosts}` : item.kind === "ad" ? `Ad read · Hosts ${item.hosts}` : "Break / Transition"}</small>
                  <strong>{item.title}</strong>
                  {game && <em>{game.d}</em>}
                </span>
                <span className="segmentState">{isActive ? "NOW" : isNext ? "UP NEXT" : expanded === item.id ? "−" : "+"}</span>
              </button>
              {expanded === item.id && (
                <div className="segmentDetails">
                  {game ? <>
                    <p>{game.n}</p>
                    <div className="cueGrid">
                      <section className="developerBlurb"><h3>Developer</h3><p><b>{game.d}</b></p><p>Developer blurb to be added.</p></section>
                      <section><h3>Player impressions</h3><p>Useful comments and hands-on notes to be added</p></section>
                      <section className="interviewQuestions"><h3>Interview questions</h3><p>To be added</p></section>
                      <section className="nextUpCard">
                        <h3>Next up after break</h3>
                        {nextGameItem && nextGame ? (
                          <p><b>{fmt(nextGameItem.start)} · Hosts {nextGameItem.hosts}</b><br />{nextGame.t} · {nextGame.d}</p>
                        ) : (
                          <p><b>{fmt(schedule[schedule.length - 1].start)} · Hosts A &amp; B</b><br />Closing / Thank You</p>
                        )}
                      </section>
                    </div>
                    <div className="detailActions"><button onClick={() => onOpenGame(item.gameIndex!)}>Open complete game card for talking points →</button><button onClick={() => setManualId(item.id)}>Mark as current segment</button></div>
                  </> : item.kind === "ad" ? <>
                    <h3>Placeholder ad copy</h3>
                    <p>Seattle Indies supports and connects independent game developers throughout the Pacific Northwest. Visit Seattle Indies to discover local projects, events, and ways to support the community. Sponsor messaging will be added when confirmed.</p>
                    <p><b>Transition out:</b> Welcome viewers back and introduce the next scheduled game and developer.</p>
                    <button onClick={() => setManualId(item.id)}>Mark as current segment</button>
                  </> : item.kind === "intro" ? <>
                    <h3>Opening cue</h3><p>Welcome viewers, introduce the event and hosts, explain the showcase format, and lead into the first game.</p>
                    <button onClick={() => setManualId(item.id)}>Mark as current segment</button>
                  </> : item.kind === "closing" ? <>
                    <h3>Closing cue</h3><p>Thank developers, sponsors, hosts, production, and viewers; share final Seattle Indies information and close the broadcast.</p>
                    <button onClick={() => setManualId(item.id)}>Mark as current segment</button>
                  </> : <>
                    <h3>Transition cue</h3><p>Reset the stage and feed, then prepare the next host pair and developer.</p>
                    <button onClick={() => setManualId(item.id)}>Mark as current segment</button>
                  </>}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="configHint">Schedule settings live in <code>src/RunOfShow.tsx</code> under <code>config</code>, so the confirmed start time and durations can be updated in one place.</p>
    </section>
  );
}
