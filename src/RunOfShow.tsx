import { useEffect, useMemo, useState } from "react";
import runOfShowData from "./generated/runOfShow.json";

export type RunGame = { id: number; t: string; d: string; n: string };

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
  productionNotes: string;
};

type GeneratedScheduleItem = {
  id: string;
  kind: ScheduleItem["kind"];
  segmentNumber: number | null;
  gameId: number | null;
  title: string;
  start: string;
  end: string;
  hosts: string;
  productionNotes: string;
};

type GeneratedRunOfShow = {
  hostNote: string;
  items: GeneratedScheduleItem[];
};

const generatedRunOfShow = runOfShowData as GeneratedRunOfShow;

const fmt = (date: Date) => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function timeOnDay(day: Date, clock: string): Date {
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(clock);
  if (!match) throw new Error(`Invalid generated schedule time: ${clock}`);
  let hour = Number(match[1]) % 12;
  if (match[3] === "PM") hour += 12;
  const result = new Date(day);
  result.setHours(hour, Number(match[2]), 0, 0);
  return result;
}

function makeSchedule(games: RunGame[], day: Date): ScheduleItem[] {
  const gameIndexById = new Map(games.map((game, index) => [game.id, index]));
  return generatedRunOfShow.items.map((item) => ({
    id: item.id,
    kind: item.kind,
    start: timeOnDay(day, item.start),
    end: timeOnDay(day, item.end),
    gameIndex: item.gameId ? gameIndexById.get(item.gameId) : undefined,
    hosts: item.hosts,
    segmentNumber: item.segmentNumber ?? undefined,
    title: item.title,
    productionNotes: item.productionNotes,
  }));
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
        {generatedRunOfShow.hostNote.replaceAll(" | ", " · ")}
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
                  {item.productionNotes && <p><b>Production notes:</b> {item.productionNotes}</p>}
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
      <p className="configHint">Schedule times, hosts, ordering, and production notes are loaded from the <code>Run of Show</code> worksheet.</p>
    </section>
  );
}
