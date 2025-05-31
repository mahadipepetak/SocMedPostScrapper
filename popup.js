
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
          listEl.appendChild(li);
        });
      }
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

refreshSelectedList();
