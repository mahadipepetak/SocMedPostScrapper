window.selectedPosts = [];
window.selectionMode = false;

function autoDetectPattern(el1, el2) {
  const getPath = (el) => {
    let path = [];
    while (el && el !== document.body) {
      let tag = el.tagName.toLowerCase();
      if (el.id) tag += `#${el.id}`;
      else if (el.className) {
        const classes = el.className.trim().split(/\s+/).join(".");
        tag += `.${classes}`;
      }
      path.unshift(tag);
      el = el.parentElement;
    }
    return path;
  };

  const path1 = getPath(el1);
  const path2 = getPath(el2);

  const common = [];
  for (let i = 0; i < Math.min(path1.length, path2.length); i++) {
    if (path1[i] === path2[i]) common.push(path1[i]);
    else break;
  }

  return {
    container: common.join(" > "),
    text: "div, p, span",
    date: "time",
    likes: "",
    shares: "",
    views: "",
  };
}

document.addEventListener(
  "click",
  function (e) {
    if (!window.selectionMode) return;

    e.preventDefault();
    e.stopPropagation();

    const post = e.target.closest("*");
    if (!post || window.selectedPosts.includes(post)) return;

    post.style.outline = "2px solid red";
    window.selectedPosts.push(post);

    chrome.runtime.sendMessage({
      action: "postSelected",
      count: window.selectedPosts.length,
      summary: post.innerText?.slice(0, 80),
    });
  },
  true
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "enableSelectionMode") {
    window.selectionMode = true;
    window.selectedPosts = [];
    sendResponse({ status: "ready" });
    return true;
  }

  if (msg.action === "getSelectedPosts") {
    const summary = window.selectedPosts.map((el, i) => ({
      index: i + 1,
      preview: el.innerText?.slice(0, 80),
    }));
    sendResponse({ count: window.selectedPosts.length, summary });
    return true;
  }

  if (msg.action === "detectPattern") {
    if (window.selectedPosts.length < 2) {
      sendResponse({ error: "Select at least 2 posts." });
      return;
    }

    const pattern = autoDetectPattern(
      window.selectedPosts[0],
      window.selectedPosts[1]
    );
    const platform = window.location.hostname;

    chrome.storage.local.get({ patterns: {} }, (res) => {
      const updated = { ...res.patterns, [platform]: pattern };
      chrome.storage.local.set({ patterns: updated }, () => {
        sendResponse({ success: true, pattern });
        window.selectionMode = false;
        window.selectedPosts = [];
      });
    });

    return true;
  }

  if (msg.action === "removeSelectedPost") {
    const removed = window.selectedPosts.splice(msg.index, 1)[0];
    if (removed) removed.style.outline = ""; // remove visual red border
    sendResponse({ success: true });
    return true;
  }
});
