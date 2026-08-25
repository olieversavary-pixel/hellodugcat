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

  // 清理 HTML 配置
  const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'code', 'pre']),
    allowedAttributes: { img: ['src', 'alt'], a: ['href'] },
  };

  return rss({
    title: config.site.title,
    description: config.site.description,
    site: config.site.url,
    items: sortedPosts.map((post) => {
      // 生成完整链接
      const link = new URL(getPostUrl(post.id, post.filePath, config.site.lang), config.site.url).toString();
      // 安全获取日期
      const date = post.data.modDatetime ?? post.data.pubDatetime;
      const pubDate = date instanceof Date ? date : new Date(date);

      return {
        link,
        title: post.data.title,
        description: post.data.description,
        pubDate,
        content: sanitizeHtml(parser.render(post.body ?? ''), sanitizeOptions),
      };
    }),
  });
}