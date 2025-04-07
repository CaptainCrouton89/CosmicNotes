// Set flag to indicate content script has loaded
window.pageContentSaverLoaded = true;

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Content script received message:", request);

  if (request.action === "getPageContent") {
    try {
      // Get the main content from the page
      const content = getPageContent();

      // Send the content back to the popup
      sendResponse({ content: content });
      console.log("Sent content response");
    } catch (error) {
      console.error("Error getting page content:", error);
      sendResponse({ error: error.message });
    }
  }
  return true; // Required to use sendResponse asynchronously
});

// Function to get the main content from the page
function getPageContent() {
  try {
    // Get page title
    const title = document.title || "Untitled Page";

    // Get page URL
    const url = window.location.href;

    // Get the main content - try to intelligently extract the most relevant content
    let mainElement =
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.querySelector("#content") ||
      document.querySelector(".content") ||
      document.querySelector(".main-content");

    // If still no element found, look for large text containers
    if (!mainElement) {
      const possibleContainers = document.querySelectorAll("div, section");
      let largestTextContent = "";

      possibleContainers.forEach((container) => {
        if (
          container.innerText &&
          container.innerText.length > largestTextContent.length
        ) {
          largestTextContent = container.innerText;
          mainElement = container;
        }
      });
    }

    // If no main content container is found, use the body
    const bodyText = mainElement
      ? mainElement.innerText
      : document.body.innerText;

    // Extract metadata (could be enhanced for specific platforms)
    const metadata = {
      // Try to get meta description
      description:
        document.querySelector('meta[name="description"]')?.content || "",
      // Try to get author
      author: document.querySelector('meta[name="author"]')?.content || "",
      // Try to get keywords
      keywords: document.querySelector('meta[name="keywords"]')?.content || "",
    };

    // Limit the content length to prevent excessive storage usage
    const maxLength = 100000; // 100K characters
    const truncatedText =
      bodyText.length > maxLength
        ? bodyText.substring(0, maxLength) +
          "... (content truncated due to length)"
        : bodyText;

    // Combine information
    return {
      title: title,
      url: url,
      text: truncatedText,
      metadata: metadata,
      capturedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getPageContent:", error);
    return {
      title: document.title || "Error Page",
      url: window.location.href,
      text: "Error capturing page content: " + error.message,
      capturedAt: new Date().toISOString(),
    };
  }
}

// Log that content script has loaded successfully
console.log("Cosmic Notes Saver content script loaded");
