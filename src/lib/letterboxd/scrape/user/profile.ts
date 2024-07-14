import { load, text } from "cheerio";

export async function scrapeUserProfile(name: string) {
  const r = await fetch(`https://letterboxd.com/${name}/`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch user profile", {
      cause: r,
    });
  }

  const html = load(await r.text());

  const displayName = html(".displayname").text();
  const avatarUrl = html(".profile-avatar .avatar img").attr("src");
  const stats = html(".profile-stats .value");

  let following = 0;
  try {
    following = parseInt(text(stats[stats.length - 2]!.children)) || 0;
  } catch (err) {}

  let followers = 0;
  try {
    followers = parseInt(stats.last().text()) || 0;
  } catch (err) {}

  const profileUrl = html(
    '[role="menuitem"][data-menuitem-trigger="clipboard"]',
  ).attr("data-clipboard-text");

  const userId = parseUserId(profileUrl);

  return {
    userId,
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
