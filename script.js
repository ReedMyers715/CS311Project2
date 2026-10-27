const fetchBtn = document.getElementById("fetch-btn");
const articleInput = document.getElementById("article-input");
const statusBox = document.getElementById("status");
const resultsBox = document.getElementById("results");

fetchBtn.addEventListener("click", fetchRevisions);
articleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") fetchRevisions();
});

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
}

async function fetchRevisions() {
  const article = articleInput.value.trim();
  resultsBox.innerHTML = "";

  if (article === "") {
    setStatus("Enter an article title to search.", true);
    return;
  }

  setStatus("Loading revisions...");
  fetchBtn.disabled = true;

  // origin=* allows the browser to call the Wikipedia API (CORS)
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions" +
    "&titles=" + encodeURIComponent(article) +
    "&rvprop=timestamp|user|comment&rvlimit=30&redirects&origin=*";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Wikipedia returned an error (status " + response.status + ").");
    }

    const data = await response.json();
    const page = Object.values(data.query.pages)[0];

    if ("missing" in page) {
      setStatus("No Wikipedia page found for \"" + article + "\". Check the spelling and try again.", true);
      return;
    }

    const revisions = page.revisions || [];
    if (revisions.length === 0) {
      setStatus("That page has no revisions to show.", true);
      return;
    }

    const redirect = data.query.redirects && data.query.redirects[0];
    const redirectNote = redirect ? " (redirected to " + redirect.to + ")" : "";
    setStatus("Showing " + revisions.length + " most recent revisions of " + page.title + redirectNote);

    displayRevisions(revisions);
  } catch (error) {
    setStatus("Could not load revisions: " + error.message, true);
  } finally {
    fetchBtn.disabled = false;
  }
}

function displayRevisions(revisions) {
  revisions.forEach((rev) => {
    const card = document.createElement("div");
    card.className = "card";

    const user = rev.user || "Hidden user";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = user.charAt(0).toUpperCase();

    const userEl = document.createElement("div");
    userEl.className = "user";
    userEl.textContent = user;

    const dateEl = document.createElement("div");
    dateEl.className = "date";
    dateEl.textContent = new Date(rev.timestamp).toLocaleString();

    card.append(avatar, userEl, dateEl);

    if (rev.comment) {
      const commentEl = document.createElement("div");
      commentEl.className = "comment";
      commentEl.textContent = rev.comment;
      card.append(commentEl);
    }

    resultsBox.appendChild(card);
  });
}