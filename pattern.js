// Common selectors for known platforms
const PATTERN_SELECTORS = {
    twitter: {
      container: ".css-1dbjc4n.r-18u37iz",
      text: "div[lang]",
      date: "time",
      likes: "[data-testid='like']",
      shares: "[data-testid='retweet']",
      views: ".view-count-selector" // Optional
    },
    reddit: {
      container: "div[data-testid='post-container']",
      text: "h3",
      date: "a[data-click-id='timestamp']",
      likes: "div[data-testid='upvoteRatio']",
      shares: "button[aria-label='share']",
      views: null
    }
  };
  
  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes("twitter.com")) return "twitter";
    if (host.includes("reddit.com")) return "reddit";
    return null;
  }

  function savePatternForPlatform(platform, pattern) {
    chrome.storage.local.get({ patterns: {} }, (result) => {
      const updated = { ...result.patterns, [platform]: pattern };
      chrome.storage.local.set({ patterns: updated }, () => {
        console.log(`Pattern for ${platform} saved`);
      });
    });
  }
  