export const defaultPatterns = {
  "reddit.com": {
    // id: {
    //   selector: "search-telemetry-tracker",
    //   attribute: "data-thingid"
    // },
    id: {
      selector: "[data-thingid]",
      attribute: "data-thingid",
    },
    post: "div[data-testid='search-post-unit']",
    text: { selector: "a[data-testid='post-title-text']" },
    date: { selector: "faceplate-timeago > time", attribute: "datetime" },
    upvotes: {
      selector: "div[data-testid='search-counter-row'] faceplate-number",
      index: 0,
      attribute: "number",
    },
    comments: {
      selector: "div[data-testid='search-counter-row'] faceplate-number",
      index: 1,
      attribute: "number",
    },
    share: {
      selector: "a[data-testid='post-title-text']",
      attribute: "href",
      prepend: "https://www.reddit.com",
    },
  },
  // "reddit.com": {
  //   post: "shreddit-post",
  //   id: "id",
  //   text: { selector: "faceplate-screen-reader-content" },
  //   date: { selector: "faceplate-timeago > time", attribute: "datetime" },
  //   // upvotes: {
  //   //   selector: "faceplate-number",
  //   //   attribute: "number",
  //   //   parentMatch: "span[data-post-click-location='vote']",
  //   // },
  //   // comments: {
  //   //   selector: "faceplate-number",
  //   //   attribute: "number",
  //   //   parentMatch: "a[data-post-click-location='comments-button']",
  //   // },
  //   upvotes: {
  //     selector: "faceplate-number",
  //     attribute: "number",
  //     index: 0
  //   },
  //   comments: {
  //     selector: "faceplate-number",
  //     attribute: "number",
  //     index: 1
  //   },
  //   share: {
  //     selector: "a[slot='full-post-link']",
  //     attribute: "href",
  //     prepend: "https://www.reddit.com",
  //   },
  // },
  // "twitter.com": {
  //   post: "article[role='article']",
  //   id: "data-tweet-id",
  //   text: "div[lang]",
  //   date: "time",
  //   likes: "div[data-testid='like'] span",
  //   comments: "div[data-testid='reply'] span",
  //   share: {
  //     selector: "a[aria-label*='Copy link to Tweet']",
  //     attribute: "href",
  //     prepend: "https://twitter.com",
  //   },
  // },
  "x.com": {
    post: "article[data-testid='tweet']",

    id: {
      selector: "div[role='group'][id^='id__']",
      attribute: "id",
    },

    text: {
      selector: "div[data-testid='tweetText']",
    },

    date: {
      selector: "time",
      attribute: "datetime",
    },
    reply: {
      selector: "button[data-testid='reply']",
      attribute: "aria-label",
      regex: "(\\d+)",
    },
    repost: {
      selector: "button[data-testid='retweet']",
      attribute: "aria-label",
      regex: "(\\d+)",
    },
    like: {
      selector: "button[data-testid='like']",
      attribute: "aria-label",
      regex: "(\\d+)",
    },
    view: {
      selector: "a[href*='/analytics']",
      attribute: "aria-label",
      regex: "(\\d+[\\d,]*)",
    },
    share: {
      selector: "a[href*='/status/']",
      attribute: "href",
      prepend: "https://twitter.com",
    },
  },
};
