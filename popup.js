
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
          removeBtn.textContent = "x Remove";
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
    chrome.tabs.sendMessage(tabs[0].id, { action: "enableSelectionMode" }, () => {
      statusEl.textContent = "Selection mode ON. Click 2+ posts.";
      listEl.innerHTML = "";
    });
  });
};

document.getElementById("detect-pattern").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "detectPattern" },
      (res) => {
        if (res?.error) alert("❌ " + res.error);
        else {
          alert("✅ Pattern detected & saved.");
          statusEl.textContent = "Pattern saved.";
          listEl.innerHTML = "";
        }
      }
    );
  });
};

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "postSelected") {
    refreshSelectedList();
  }
});

document.getElementById("map-fields").onclick = () => {
  alert("Field mapping coming soon. Will allow clicking post elements to tag text/date/likes etc.");
  // Future version: sendMessage to start mapping fields (like 'startFieldMapping')
};

function loadSavedPattern() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          return new Promise((resolve) => {
            chrome.storage.local.get("patterns", (res) => {
              resolve(res.patterns || {});
            });
          });
        },
      },
      (injectionResults) => {
        const patternView = document.getElementById("pattern-view");
        if (injectionResults?.[0]?.result) {
          const host = new URL(tabs[0].url).hostname;
          const pattern = injectionResults[0].result[host];
          patternView.textContent = pattern
            ? JSON.stringify(pattern, null, 2)
            : "No saved pattern for this site.";
        } else {
          patternView.textContent = "Could not load pattern.";
        }
      }
    );
  });
}

refreshSelectedList();
loadSavedPattern(); 