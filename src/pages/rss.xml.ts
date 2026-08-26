import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";

// 1. 开启 xhtmlOut，强制输出严格符合 XML 规范的自闭合标签 (<hr /> <br />)
const parser = new MarkdownIt({
  xhtmlOut: true,
  html: true,
});

export async function GET() {
  const posts = await getCollection("posts");
  const sortedPosts = getSortedPosts(posts);

  return rss({
    title: config.site.title,
    description: config.site.description,
    site: config.site.url,
    items: sortedPosts.map((post) => {
      const rawHtml = parser.render(post.body ?? "");

      // 2. 扩充 sanitize-html 允许的标签与属性，防止标题和媒体元素被过滤
      const cleanHtml = sanitizeHtml(rawHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "h1",
          "h2",
          "img",
          "audio",
          "source",
          "iframe",
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          "*": ["class", "id"],
          audio: ["src", "controls", "preload"],
          source: ["src", "type"],
          img: ["src", "alt", "title"],
        },
      });

      const postUrl = new URL(
        getPostUrl(post.id, post.filePath, config.site.lang),
        config.site.url
      ).href;

      // 3. 防御性日期解析，防止 Invalid Date 破坏 XML
      const rawDate = post.data.pubDatetime ?? post.data.modDatetime;
      const parsedDate = rawDate ? new Date(rawDate) : new Date();
      const pubDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      return {
        link: postUrl,
        title: post.data.title,
        description: post.data.description,
        pubDate: pubDate,
        content: cleanHtml,
      };
    }),
  });
}a