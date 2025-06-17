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

function buildSafeTag(el, allowId = true) {
  if (!el || !el.tagName) return "";

  let tag = el.tagName.toLowerCase();

  if (!allowId && el.id) {
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

      console.log("🔍 Clicked Element:", e.target);
      console.log("🔍 InnerText:", e.target.innerText || e.target.textContent);
      console.log("🔍 Full Tag Path:");

      let current = e.target;
      const steps = [];
      while (current && current !== document.body) {
        steps.unshift(buildSafeTag(current));
        current = current.parentElement;
      }
      console.log(steps.join(" > "));
    };

    const autoDetectRelativeSelector = (elements) => {
      const relativePaths = elements.map((el) => {
        const container = findPostContainer(el);
        let current = el;
        const path = [];

        // Build path UP from clicked element to post container
        while (current && current !== container) {
          // Skip id for the clicked child element only
          const skipId = current === el;
          console.log("🔍 Current Element:", { current });
          console.log("el: ", { el });
          console.log("skipId", skipId);
          path.unshift(buildSafeTag(current, skipId));
          // path.unshift(buildSafeTag(current));
          current = current.parentElement;
        }

        // Optional: include container tag too
        // path.unshift(buildSafeTag(container));

        return path;
      });

      // Compare all paths to find the longest common prefix
      const shortest = Math.min(...relativePaths.map((p) => p.length));
      const common = [];

      for (let i = 0; i < shortest; i++) {
        const step = relativePaths[0][i];
        if (relativePaths.every((p) => p[i] === step)) {
          common.push(step);
        } else break;
      }

      // const selector = common.join(" > ");
      const selector = relativePaths[0].slice(common.length).join(" > ");
      console.log("✅ Field selector (relative to post):", selector);
      return selector;
    };

    const findPostContainer = (el) => {
      const containerSelector = (() => {
        const host = window.location.hostname;
        const patterns = JSON.parse(
          localStorage.getItem("cachedPatterns") || "{}"
        );
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

        chrome.storage.local.set(
          { patterns: { ...patterns, [host]: updatedPattern } },
          () => {
            chrome.runtime.sendMessage({ action: "fieldsMapped", done: true });
          }
        );
      });
    };

    askNextField();
    sendResponse({ started: true });
    return true;
  }

  if (msg.action === "extractPosts") {
    extractPostsFromDOM();
  }
});

function extractPostsFromDOM() {
  console.log("🔍 Running extractPostsFromDOM...");
  chrome.storage.local.get("patterns", (res) => {
    const host = location.hostname.replace(/^www\./, "");
    const pattern = res.patterns?.[host];
    if (!pattern) {
      alert("❌ No pattern saved for this site.");
      return;
    }

    const posts = document.querySelectorAll(pattern.post || "article");
    const data = [];

    posts.forEach((post) => {
      const result = {};

      for (const [field, def] of Object.entries(pattern)) {
        if (field === "post") continue;
        // Special case: if field is "id" and pattern.id is {attribute: ...}, extract from post itself
        if (
          field === "id" &&
          typeof def === "object" &&
          def.attribute &&
          !def.selector
        ) {
          result[field] = post.getAttribute(def.attribute) || "";
          continue;
        }
        result[field] = extractField(post, field, def);
      }

      data.push(result);
    });

    alert(`✅ Extracted ${data.length} post(s). CSV downloaded.`);
    const csv = convertToCSV(data);
    triggerDownload(csv, `posts_${host}.csv`);
  });
}

function extractField(post, fieldName, def) {
  let value = "";
  console.log(`🧪 Extracting "${fieldName}" using`, def);
  let el;
  if (def === "id") {
    value = post.getAttribute("id") || "";
  } else if (typeof def === "object") {
    el = resolveElement(post, def);
    value = el ? getValueFromElement(el, def) : "";
  } else {
    // fallback for legacy plain selector string
    el = post.querySelector(def);
    value = el?.textContent.trim() || "";
  }

  console.log("el::", el ?? null);

  if (["comments", "upvotes", "share"].includes(fieldName)) {
    console.log(`📦 Field "${fieldName}"`, {
      selector: typeof def === "object" ? def.selector : def,
      attribute: typeof def === "object" ? def.attribute : null,
      parentMatch: typeof def === "object" ? def.parentMatch : null,
      value,
    });
  }

  console.log(`✅ Value for "${fieldName}":`, value);
  return value;
}

function resolveElement(post, def) {
  const candidates = post.querySelectorAll(def.selector || "*");

  if (def.parentMatch) {
    const filtered = Array.from(candidates).filter((el) =>
      el.closest(def.parentMatch)
    );
    if (filtered.length > 0) return filtered[0];
  }

  if (typeof def.index === "number") {
    return candidates[def.index] || null;
  }

  return candidates[0] || null;
}

function getValueFromElement(el, def) {
  let rawValue = def.attribute
    ? el.getAttribute(def.attribute)
    : el.textContent;

  // Apply regex extraction if present
  if (def.regex) {
    const match = rawValue.match(new RegExp(def.regex));
    rawValue = match ? match[1] : "";
  }

  return def.prepend ? def.prepend + rawValue : (rawValue || "").trim();
}

function convertToCSV(data) {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  console.log(`📥 CSV Ready. ${filename}`, content);

  a.click();
  URL.revokeObjectURL(url);
}
