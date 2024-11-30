const fetchButton = document.getElementById("fetchButton");
const categoryInput = document.getElementById("categoryInput");
const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");
const sortSelect = document.getElementById("sortSelect");
const thumbnailSizeInput = document.getElementById("thumbnailSize");
const loadMoreButton = document.getElementById("loadMoreButton");

let images = [];
let category = "";
let isLoading = false;
let continuationToken = null;
let currentSortCriteria = "date"; // Default sort
let thumbnailSizePercentage = 20; // Default to 20% of the window width

// Update the URL with the category name, so users can share or bookmark the gallery
function updateURLWithCategory(category) {
  const params = new URLSearchParams(window.location.search);
  params.set("category", category);
  const newURL = `${window.location.origin}${window.location.pathname}?${params}`;
  
  // Push the new state to the browser's history so the back button works
  window.history.pushState({ category }, "", newURL);
}

async function fetchImages() {
  if (isLoading) return;
  isLoading = true;
  loading.classList.remove("hidden");

  const queryParams = {
    action: "query",
    format: "json",
    origin: "*",
    prop: [
      "imageinfo",
      "pageimages",
      // "revisions"
    ].join("|"),
    iiprop: [
      "user",
      "timestamp",
      "metadata",
    ].join("|"),
    piprop: "thumbnail",
    pithumbsize: "320",
    // rvprop: "content",
    // rvslots: "main",
    generator: "categorymembers",
    gcmtitle: `Category:${category}`,
    gcmtype: "file",
    gcmlimit: "50",
  };

  if (continuationToken) {
    queryParams.gcmcontinue = continuationToken;
  }

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `https://commons.wikimedia.org/w/api.php?${queryString}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.query) {
      alert("No images found or an error occurred.");
      return;
    }

    const pages = Object.values(data.query.pages);
    const promises = pages.map(processPage);
    await Promise.all(promises);

    continuationToken = data.continue ? data.continue.gcmcontinue : null;
    loadMoreButton.classList.toggle("hidden", !continuationToken);

    sortImages(currentSortCriteria);  // Reapply the selected sort order
    displayImages();
  } catch (error) {
    console.error("Error fetching images:", error);
    alert("An error occurred while fetching images. Please try again.");
  } finally {
    isLoading = false;
    loading.classList.add("hidden");
  }
}

async function processPage(page) {
  const timestamp = page.imageinfo[0]?.timestamp || null;
  const url = page.thumbnail?.source || null;

  let exifTimestamp = null;
  if (page.imageinfo[0]) {
    page.imageinfo[0].metadata.forEach(datum => {
      if (datum.name == "DateTimeOriginal") {
        let [date, time] = datum.value.split(" ");
        date = date.split(":").join("-");
        exifTimestamp = date + "T" + time;
      }
    })
  }

  // Attempt to fetch P571 (date of inception)
  const queryParams = {
    action: "wbgetclaims",
    format: "json",
    origin: "*",
    entity: `M${page.pageid}`,
    property: "P571", // Date of inception
  };

  // date of inception does not include time
  // see https://phabricator.wikimedia.org/T266407

  const queryString = new URLSearchParams(queryParams).toString();
  const claimUrl = `https://commons.wikimedia.org/w/api.php?${queryString}`;

  let inceptionTimestamp = null;
  try {
    const response = await fetch(claimUrl);
    const data = await response.json();
    if (data.claims?.P571?.[0]?.mainsnak?.datavalue?.value?.time) {
      inceptionTimestamp = data.claims.P571[0].mainsnak.datavalue.value.time;
      inceptionTimestamp = inceptionTimestamp.startsWith("+")
        ? inceptionTimestamp.substr(1) // Remove leading "+"
        : inceptionTimestamp;
    }
  } catch (error) {
    console.warn(`Failed to fetch P571 for ${page.title}:`, error);
  }

  images.push({
    title: page.title,
    url,
    timestamp: inceptionTimestamp || timestamp,
    user: page.imageinfo[0]?.user || "Unknown",
  });
}

function displayImages() {
  const galleryWidth = window.innerWidth;
  const thumbnailSize = (thumbnailSizePercentage / 100) * galleryWidth;

  gallery.innerHTML = "";

  images.forEach(image => {
    const container = document.createElement("div");
    container.classList.add("image-container");

    const img = document.createElement("img");
    img.src = image.url;
    img.alt = image.title;
    img.style.width = "100%";
    img.style.height = "auto";

    const title = document.createElement("div");
    title.classList.add("image-title");
    title.textContent = image.title;

    container.appendChild(img);
    container.appendChild(title);
    container.addEventListener("click", () => {
      window.open(
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(image.title)}`,
        "_blank"
      );
    });

    gallery.appendChild(container);
  });

  const columns = Math.max(1, Math.floor(window.innerWidth / thumbnailSize));
  gallery.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
}

function sortImages(criteria) {
  if (criteria === "date") {
    images.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } else if (criteria === "title") {
    images.sort((a, b) => a.title.localeCompare(b.title));
  }
}

fetchButton.addEventListener("click", () => {
  category = categoryInput.value.trim();
  if (!category) {
    alert("Please enter a category name.");
    return;
  }

  images = [];
  continuationToken = null;
  gallery.innerHTML = "";
  loadMoreButton.classList.add("hidden");

  updateURLWithCategory(category);
  fetchImages();
});

sortSelect.addEventListener("change", (event) => {
  currentSortCriteria = event.target.value;
  sortImages(currentSortCriteria);
  displayImages();
});

thumbnailSizeInput.addEventListener("input", (event) => {
  thumbnailSizePercentage = parseInt(event.target.value);
  displayImages();
});

loadMoreButton.addEventListener("click", fetchImages);

// Automatically load gallery if category is in the URL
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get("category");
  if (urlCategory) {
    category = urlCategory;
    categoryInput.value = category;
    fetchImages();
  }
});

// Listen for back/forward browser navigation
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.category) {
    category = event.state.category;
    categoryInput.value = category;
    images = []; // Clear images
    continuationToken = null;
    gallery.innerHTML = ""; // Clear the gallery
    loadMoreButton.classList.add("hidden");

    fetchImages();
  }
});

// Prevent the slider from being reset or updated when window is resized
window.addEventListener("resize", () => {
  displayImages();  // Update the thumbnail size based on window width, but don't update slider
});
