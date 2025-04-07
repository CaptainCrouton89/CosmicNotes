document.addEventListener("DOMContentLoaded", function () {
  // Get elements
  const saveButton = document.getElementById("save-button");
  const statusDiv = document.getElementById("status");
  const cosmicLink = document.getElementById("cosmic-link");
  let errorMsgShown = false;

  // Set the Cosmic Notes URL from config
  cosmicLink.href = CONFIG.API_BASE_URL;

  // Add event listener to save button
  saveButton.addEventListener("click", function () {
    // Execute content script to get the page content
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Get the current tab
      const currentTab = tabs[0];

      // First try to inject the content script programmatically to ensure it's loaded
      chrome.scripting
        .executeScript({
          target: { tabId: currentTab.id },
          files: ["content.js"],
        })
        .then(() => {
          // Now send message to content script to get page content
          chrome.tabs.sendMessage(
            currentTab.id,
            { action: "getPageContent" },
            function (response) {
              // Check for error
              if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
                if (!errorMsgShown) {
                  showStatus("Error: Could not access page content.", "red");
                  errorMsgShown = true;
                }
                return;
              }

              if (response && response.content) {
                // Save the content to API
                saveNoteToAPI(response.content);
              } else {
                // Handle missing response
                showStatus(
                  "Error: Invalid response from content script.",
                  "red"
                );
              }
            }
          );
        })
        .catch((err) => {
          console.error("Script injection error:", err);
          showStatus("Error: Could not inject content script.", "red");
        });
    });
  });

  // Function to save a note to API endpoint
  function saveNoteToAPI(content) {
    // Format the data for the API
    const apiData = {
      content: content.text,
      metadata: {
        title: content.title,
        url: content.url,
        capturedAt: content.capturedAt,
      },
    };

    // Get the full API URL from the config
    const apiUrl = getApiUrl(CONFIG.ENDPOINTS.NOTE);

    // Send the data to the API endpoint
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data);
        showStatus("Content saved successfully!", "green");
      })
      .catch((error) => {
        console.error("Error saving to API:", error);
        showStatus("Error saving to API.", "red");
      });
  }

  // Helper to show status message with color
  function showStatus(message, color) {
    statusDiv.textContent = message;
    statusDiv.style.color = color;
    statusDiv.style.display = "block";
    setTimeout(function () {
      statusDiv.style.display = "none";
    }, 3000);
  }
});
