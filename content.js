window.selectedPosts = [];
window.selectionMode = false;

function autoDetectPattern(el1, el2) {
  const getPath = (el) => {
    let path = [];
    while (el && el !== document.body) {
      // let tag = el.tagName.toLowerCase();
      // if (el.id) tag += `#${el.id}`;
      // else if (el.className) {
      //   const safeClasses = el.className
      //     .trim()
      //     .split(/\s+/)
      //     .filter((cls) => /^[a-zA-Z0-9_-]+$/.test(cls)) // ✅ only safe class names
      //     .join(".");

      //   if (safeClasses) {
      //     tag += `.${safeClasses}`;
      //   }
      // }
      // path.unshift(tag);
      path.unshift(buildSafeTag(el));
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
    date: "",
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

function buildSafeTag(el) {
  if (!el || !el.tagName) return "";

  let tag = el.tagName.toLowerCase();

  if (el.id) {
    tag += `#${el.id}`;
  } else if (el.className) {
    const safeClasses = el.className
      .trim()
      .split(/\s+/)
      .filter((cls) => /^[a-zA-Z0-9_-]+$/.test(cls)) // ✅ valid class names only
      .join(".");
    if (safeClasses) tag += `.${safeClasses}`;
  }

  return tag;
}

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

  if (msg.action === "startFieldMapping") {
    const selectors = {};

    const askNextField = () => {
      const field = prompt(
        "Enter field name (e.g. text, date, likes).\nLeave blank or press Cancel to finish."
      );

      if (!field) {
        document.removeEventListener("click", captureClick, true);

        const host = window.location.hostname;
        chrome.storage.local.get({ patterns: {} }, (res) => {
          const patterns = res.patterns || {};
          const oldPattern = patterns[host] || { container: "" };
          const updatedPattern = { ...oldPattern, ...selectors };

          chrome.storage.local.set(
            { patterns: { ...patterns, [host]: updatedPattern } },
            () => {
              chrome.runtime.sendMessage({
                action: "fieldsMapped",
                done: true,
              });
            }
          );
        });

        return;
      }

      const manualSelector = prompt(
        `Enter CSS selector for "${field}" (optional).\nLeave blank to select element manually.`
      );

      if (manualSelector) {
        selectors[field] = manualSelector;
        askNextField(); // Repeat
      } else {
        currentField = field;
        alert(`Click the element to assign to "${field}".`);
        document.addEventListener("click", captureClick, true);
      }
    };

    let currentField = null;

    const captureClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.removeEventListener("click", captureClick, true);

      const el = e.target;

      chrome.storage.local.get("patterns", (res) => {
        const host = window.location.hostname;
        const containerSelector = res.patterns?.[host]?.container || "body";

        // const postContainer = el.closest(containerSelector);
        const containers = document.querySelectorAll(containerSelector);
        let postContainer = null;
        for (const c of containers) {
          if (c.contains(el)) {
            postContainer = c;
            break;
          }
        }

        if (!postContainer) {
          alert("❌ Could not find post container based on saved pattern.");
          return;
        }

        let current = el;
        const path = [];

        while (current && current !== postContainer) {
          // let tag = current.tagName.toLowerCase();
          // if (current.id) tag += `#${current.id}`;
          // else if (current.className) {
          //   const classes = current.className.trim().split(/\s+/).join(".");
          //   tag += `.${classes}`;
          // }
          // path.unshift(tag);
          path.unshift(buildSafeTag(current));
          current = current.parentElement;
        }

        // Include the clicked element itself
        // let tag = el.tagName.toLowerCase();
        // if (el.id) tag += `#${el.id}`;
        // else if (el.className) {
        //   const classes = el.className.trim().split(/\s+/).join(".");
        //   tag += `.${classes}`;
        // }

        // if (!path.includes(tag)) {
        //   path.push(tag);
        // }
        // path.push(tag);
        const tag = buildSafeTag(el);
        if (!path.includes(tag)) {
          path.push(tag);
        }

        const relativeSelector = path.join(" > ");
        selectors[currentField] = relativeSelector;

        alert(`✅ Field "${currentField}" mapped to:\n${relativeSelector}`);
        askNextField();
      });
    };

    askNextField();
    sendResponse({ started: true });
    return true;
  }
});
