const statusEl = document.getElementById("status");
const listEl = document.getElementById("selected-list");

function refreshSelectedList() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getSelectedPosts" },
      (res) => {
        listEl.innerHTML = "";
        if (!res || res.count === 0) {
          statusEl.textContent = "No posts selected yet.";
          return;
        }
        statusEl.textContent = `${res.count} post(s) selected:`;
        res.summary.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = `${item.index}. ${item.preview}`;

          const removeBtn = document.createElement("button");
          removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 448 512"><path fill="currentColor" d="M135.2 17.7C142.2 7.4 153.7 0 166.4 0h115.2c12.7 0 24.2 7.4 31.2 17.7l17.6 26.3H432c8.8 0 16 7.2 16 16s-7.2 16-16 16h-16.6l-26.2 393.5c-1.7 26-23.3 46.5-49.3 46.5H108.1c-26 0-47.6-20.5-49.3-46.5L32.6 76H16c-8.8 0-16-7.2-16-16s7.2-16 16-16h101.6l17.6-26.3zM167.1 84c-6.6 0-12 5.4-12 12v288c0 6.6 5.4 12 12 12s12-5.4 12-12V96c0-6.6-5.4-12-12-12zm57.9 0c-6.6 0-12 5.4-12 12v288c0 6.6 5.4 12 12 12s12-5.4 12-12V96c0-6.6-5.4-12-12-12zm57.9 0c-6.6 0-12 5.4-12 12v288c0 6.6 5.4 12 12 12s12-5.4 12-12V96c0-6.6-5.4-12-12-12z"/></svg>`;
          removeBtn.style.marginLeft = "10px";
          removeBtn.onclick = () => removeSelectedPost(item.index - 1);

          li.appendChild(removeBtn);
          listEl.appendChild(li);
        });
      }
    );
  });
}

function removeSelectedPost(index) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "removeSelectedPost", index },
      () => refreshSelectedList()
    );
  });
}

document.getElementById("start-select").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "enableSelectionMode" },
      () => {
        statusEl.textContent = "Selection mode ON. Click 2+ posts.";
        listEl.innerHTML = "";
      }
    );
  });
};

document.getElementById("detect-pattern").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "detectPattern" }, (res) => {
      if (res?.error) alert("❌ " + res.error);
      else {
        alert("✅ Pattern detected & saved.");
        statusEl.textContent = "Pattern saved.";
        listEl.innerHTML = "";
        loadSavedPattern();
      }
    });
  });
};

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "postSelected") {
    refreshSelectedList();
  }
});

document.getElementById("map-fields").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "startFieldMapping" }, (res) => {
      if (res?.done) {
        alert("✅ Field selectors saved.");
        loadSavedPattern();
      } else {
        alert("⚠️ Field mapping cancelled or failed.");
      }
    });
  });
};

function loadSavedPattern() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const host = new URL(tabs[0].url).hostname;

    chrome.storage.local.get("patterns", (res) => {
      const patternView = document.getElementById("pattern-view");
      const pattern = res.patterns?.[host];
      patternView.textContent = pattern
        ? JSON.stringify(pattern, null, 2)
        : "No saved pattern for this site.";
    });
  });
}

document.getElementById("clear-pattern").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const host = new URL(tabs[0].url).hostname;

    chrome.storage.local.get("patterns", (res) => {
      const patterns = res.patterns || {};
      if (patterns[host]) {
        delete patterns[host];
        chrome.storage.local.set({ patterns }, () => {
          alert(`🗑 Pattern for ${host} removed.`);
          loadSavedPattern();
        });
      } else {
        alert("⚠️ No saved pattern for this site.");
      }
    });
  });
};

refreshSelectedList();
loadSavedPattern();
