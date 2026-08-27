import gameData from "./generated/games.json";

export type Availability = "Released" | "Not yet released";

type GeneratedGame = {
  id: string;
  title: string;
  developer: string;
  platforms: string[];
  displayPlatforms: string[];
  availability: string;
  release: string;
  demo: string;
  overview: string;
  description: string;
  officialUrl: string | null;
  steamAppId: string | null;
  youtubeVideoId: string;
  mediaSlug: string;
  mediaFolder: string;
};

export type Game = {
  id: string;
  t: string;
  d: string;
  p: string[];
  s: Availability;
  n: string;
  l: string;
  u?: string;
  slug: string;
  mediaFolder: string;
  videoId: string;
  steamId?: string;
  r: string;
  demo: string;
};

export const games: Game[] = (gameData as GeneratedGame[]).map((game) => ({
  id: game.id,
  t: game.title,
  d: game.developer,
  p: game.displayPlatforms,
  s: game.availability as Availability,
  n: game.overview,
  l: game.description,
  u: game.officialUrl ?? undefined,
  slug: game.mediaSlug,
  mediaFolder: game.mediaFolder,
  videoId: game.youtubeVideoId,
  steamId: game.steamAppId ?? undefined,
  r: game.release,
  demo: game.demo,
}));
