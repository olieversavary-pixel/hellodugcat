import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";

const parser = new MarkdownIt();

export async function GET() {
  const posts = await getCollection("posts");
  const sortedPosts = getSortedPosts(posts);

  return rss({
    title: config.site.title,
    description: config.site.description,
    site: config.site.url,
    items: sortedPosts.map((post) => {
      const html = parser.render(post.body ?? "");
      const cleanHtml = sanitizeHtml(html);

      const postUrl = new URL(
        getPostUrl(post.id, post.filePath, config.site.lang),
        config.site.url
      ).href;

      return {
        link: postUrl,
        title: post.data.title,
        description: post.data.description,
        pubDate: new Date(post.data.modDatetime ?? post.data.pubDatetime),
        // @astrojs/rss 会自动处理 CDATA 与 content:encoded 标签，无需额外写 customData
        content: cleanHtml,
      };
    }),
  });
}