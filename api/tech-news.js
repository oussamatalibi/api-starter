import { handleOptions, allowGetOnly, sendJson } from "../lib/_helpers.js";

const HN_BASE_URL = "https://hacker-news.firebaseio.com/v0";

function normalizeStory(story) {
  if (!story || story.type !== "story" || !story.title) return null;

  return {
    id: story.id,
    title: story.title,
    author: story.by || "unknown",
    score: story.score || 0,
    comments: Array.isArray(story.kids) ? story.kids.length : 0,
    url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
    discussionUrl: `https://news.ycombinator.com/item?id=${story.id}`,
    publishedAt: story.time ? new Date(story.time * 1000).toISOString() : null
  };
}

export default async function handler(req, res) {
  try {
    if (handleOptions(req, res)) return;
    if (!allowGetOnly(req, res)) return;

    const topResponse = await fetch(`${HN_BASE_URL}/topstories.json`);
    if (!topResponse.ok) {
      throw new Error(`Hacker News returned ${topResponse.status}`);
    }

    const ids = await topResponse.json();
    const storyIds = Array.isArray(ids) ? ids.slice(0, 12) : [];
    const stories = await Promise.all(
      storyIds.map(async (id) => {
        const response = await fetch(`${HN_BASE_URL}/item/${id}.json`);
        if (!response.ok) return null;
        return normalizeStory(await response.json());
      })
    );

    const data = stories.filter(Boolean).slice(0, 6);

    sendJson(res, 200, {
      success: true,
      source: "Hacker News",
      data
    });
  } catch (error) {
    sendJson(res, 502, {
      success: false,
      message: "Could not load latest tech news.",
      detail: error.message
    });
  }
}
