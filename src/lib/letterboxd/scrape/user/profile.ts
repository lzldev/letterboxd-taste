import { load } from "cheerio";

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

  const profileUrl = html(
    '[role="menuitem"][data-menuitem-trigger="clipboard"]',
  ).attr("data-clipboard-text");
  const userId = parseUserId(profileUrl);

  return {
    userId,
    displayName,
    avatarUrl,
  };
}

function parseUserId(profileUrl = "") {
  const slashIdx = profileUrl.lastIndexOf("/");
  if (slashIdx === -1) {
    throw new Error(`Invalid Profile URL ${profileUrl}`);
  }

  return profileUrl.substring(slashIdx + 1);
}
