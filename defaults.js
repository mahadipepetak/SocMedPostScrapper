const defaultPatterns = {
    "reddit.com": {
      post: "shreddit-post",
      id: "id",
      text: "faceplate-screen-reader-content",
      date: "faceplate-timeago > time",
      upvotes: "span[data-post-click-location='vote'] faceplate-number",
      comments: "a[name='comments-action-button'] faceplate-number",
      share: {
        selector: "shreddit-post-share-button",
        attribute: "permalink",
        prepend: "https://www.reddit.com"
      }
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
        prepend: "https://twitter.com"
      }
    }
  };