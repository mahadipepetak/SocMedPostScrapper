export const defaultPatterns = {
  "reddit.com": {
    post: "shreddit-post",
    id: "id",
    text: { selector: "faceplate-screen-reader-content" },
    date: { selector: "faceplate-timeago > time", attribute: "datetime" },
    // upvotes: {
    //   selector: "faceplate-number",
    //   attribute: "number",
    //   parentMatch: "span[data-post-click-location='vote']",
    // },
    // comments: {
    //   selector: "faceplate-number",
    //   attribute: "number",
    //   parentMatch: "a[data-post-click-location='comments-button']",
    // },
    upvotes: {
      selector: "faceplate-number",
      attribute: "number",
      index: 0
    },
    comments: {
      selector: "faceplate-number",
      attribute: "number",
      index: 1
    },
    share: {
      selector: "a[slot='full-post-link']",
      attribute: "href",
      prepend: "https://www.reddit.com",
    },
  },
  "twitter.com": {
    post: "article[role='article']",
    id: "data-tweet-id",
    text: "div[lang]",
    date: "time",
    likes: "div[data-testid='like'] span",
    comments: "div[data-testid='reply'] span",
    share: {
      selector: "a[aria-label*='Copy link to Tweet']",
      attribute: "href",
      prepend: "https://twitter.com",
    },
  },
};
