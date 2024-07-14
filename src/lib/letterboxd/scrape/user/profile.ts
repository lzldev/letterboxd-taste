import { type AnyNode, load, text } from "cheerio";
import { parseIntFromCheerioEl } from "../utils";

export async function scrapeUserProfile(name: string) {
  const r = await fetch(`https://letterboxd.com/${name}/`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch user profile", {
      cause: r,
    });
  }

  const html = load(await r.text());

  const displayNameEl = html(".displayname");
  const displayName = displayNameEl.text();
  const username = displayNameEl.attr("title");

  const avatarUrl = html(".profile-avatar .avatar img").attr("src");
  const stats = html(".profile-stats .value");

  const following = parseIntFromCheerioEl(stats[stats.length - 2]!.children);
  const followers = parseIntFromCheerioEl(stats.last());

  const profileUrl = html(
    '[role="menuitem"][data-menuitem-trigger="clipboard"]',
  ).attr("data-clipboard-text");

  const userId = parseUserId(profileUrl);

  return {
    userId,
    username,
    displayName,
    avatarUrl,
    followers,
    following,
  };
}

function parseUserId(profileUrl = "") {
  const slashIdx = profileUrl.lastIndexOf("/");
  if (slashIdx === -1) {
    throw new Error(`Invalid Profile URL ${profileUrl}`);
  }

  return profileUrl.substring(slashIdx + 1);
}
