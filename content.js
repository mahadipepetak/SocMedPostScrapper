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
    let currentField = null;
    let selectedElements = [];
  
    const askNextField = () => {
      selectedElements = [];
  
      currentField = prompt(
        "Enter field name (e.g. text, date, likes).\nLeave blank or press Cancel to finish."
      );
  
      if (!currentField) {
        saveFieldMappings();
        return;
      }
  
      alert(
        `Click 2 or more elements from different posts for "${currentField}".\nClick ESC to finish selecting.`
      );
  
      document.addEventListener("click", captureFieldClick, true);
      document.addEventListener("keydown", escapeToFinish, true);
    };
  
    const escapeToFinish = (e) => {
      if (e.key === "Escape") {
        document.removeEventListener("click", captureFieldClick, true);
        document.removeEventListener("keydown", escapeToFinish, true);
  
        if (selectedElements.length < 2) {
          alert("❌ Please select at least 2 elements.");
          askNextField();
          return;
        }
  
        const commonSelector = autoDetectRelativeSelector(selectedElements);
        selectors[currentField] = commonSelector;
  
        alert(`✅ Selector for "${currentField}":\n${commonSelector}`);
        askNextField();
      }
    };
  
    const captureFieldClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      selectedElements.push(e.target);
      e.target.style.outline = "2px dashed orange";
    };
  
    const autoDetectRelativeSelector = (elements) => {
      const paths = elements.map((el) => {
        const container = findPostContainer(el);
        let current = el;
        const path = [];
  
        while (current && current !== container) {
          path.unshift(buildSafeTag(current));
          current = current.parentElement;
        }
  
        const tag = buildSafeTag(el);
        if (!path.includes(tag)) path.push(tag);
  
        return path;
      });
  
      const shortest = Math.min(...paths.map((p) => p.length));
      const common = [];
  
      for (let i = 0; i < shortest; i++) {
        const step = paths[0][i];
        if (paths.every((p) => p[i] === step)) {
          common.push(step);
        } else break;
      }
  
      return common.join(" > ");
    };
  
    const findPostContainer = (el) => {
      const containerSelector = (() => {
        const host = window.location.hostname;
        const patterns = JSON.parse(localStorage.getItem("cachedPatterns") || "{}");
        return patterns[host]?.container || "body";
      })();
  
      const containers = document.querySelectorAll(containerSelector);
      for (const c of containers) {
        if (c.contains(el)) return c;
      }
      return document.body;
    };
  
    const saveFieldMappings = () => {
      const host = window.location.hostname;
      chrome.storage.local.get({ patterns: {} }, (res) => {
        const patterns = res.patterns || {};
        const oldPattern = patterns[host] || { container: "" };
        const updatedPattern = { ...oldPattern, ...selectors };
  
        chrome.storage.local.set({ patterns: { ...patterns, [host]: updatedPattern } }, () => {
          chrome.runtime.sendMessage({ action: "fieldsMapped", done: true });
        });
      });
    };
  
    askNextField();
    sendResponse({ started: true });
    return true;
  }
});
