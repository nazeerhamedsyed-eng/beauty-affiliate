// LuxeBeauty Application Script

// 1. Dynamic Product Database loaded at runtime
let PRODUCTS = [];


// 2. Ingredients Dictionary for Safe-Decoder
const INGREDIENTS_DB = {
  "aqua": { safety: "safe", function: "Solvent / Water base", note: "Primary solvent used to dissolve cosmetics ingredients." },
  "water": { safety: "safe", function: "Solvent / Water base", note: "Primary solvent used to dissolve cosmetics ingredients." },
  "niacinamide": { safety: "safe", function: "Vitamin B3 / Skin Brightener", note: "Outstanding ingredient that restores skin barrier, controls sebum, and fades dark spots." },
  "retinol": { safety: "caution", function: "Anti-Aging Active", note: "Highly effective at cellular renewal, but can cause irritation, redness, and sun sensitivity. Use only at night and wear SPF." },
  "glycerin": { safety: "safe", function: "Humectant / Moisture Binder", note: "A natural skin moisturizer that keeps the skin hydrated and healthy." },
  "phenoxyethanol": { safety: "safe", function: "Preservative", note: "A safe, globally approved preservative used to prevent bacterial growth in beauty products. Max 1% concentration." },
  "salicylic acid": { safety: "caution", function: "Beta Hydroxy Acid (BHA)", note: "Excellent oil-soluble exfoliant that clears blackheads and pores. Can be drying; use in moderation." },
  "hyaluronic acid": { safety: "safe", function: "Hydrating Humectant", note: "Holds up to 1000x its weight in water. Plumps skin and minimizes fine lines." },
  "fragrance": { safety: "caution", function: "Sensitizing Perfume", note: "Added for pleasant aroma, but is a common cause of contact dermatitis and irritation in sensitive skin types." },
  "parfum": { safety: "caution", function: "Sensitizing Perfume", note: "Added for pleasant aroma, but is a common cause of contact dermatitis and irritation in sensitive skin types." }
};

// State Variables
let activeCategory = "all";
let searchQuery = "";

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  // Fetch products dynamically from JSON database
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      PRODUCTS = data;
    })
    .catch(err => console.error("Error loading products database:", err));

  renderProducts();
  setupEventListeners();
  loadInitialChat();
});

// DOM-Based Card Filtering
function renderProducts() {
  const cards = document.querySelectorAll(".product-card");
  let visibleCount = 0;
  
  cards.forEach(card => {
    const category = card.getAttribute("data-category");
    const brand = card.getAttribute("data-brand");
    const name = card.getAttribute("data-name");
    
    const matchesCategory = activeCategory === "all" || category === activeCategory;
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const matchesSearch = searchTerms.every(term => 
      name.includes(term) || brand.includes(term)
    );
                          
    if (matchesCategory && matchesSearch) {
      card.style.display = "block";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  // Handle Empty State
  let noResults = document.querySelector(".no-results");
  if (visibleCount === 0) {
    if (!noResults) {
      noResults = document.createElement("div");
      noResults.className = "no-results";
      noResults.style.cssText = "grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-muted);";
      noResults.innerText = "No products found matching your search.";
      document.getElementById("product-grid").appendChild(noResults);
    }
  } else {
    if (noResults) noResults.remove();
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Search box
  const searchInput = document.getElementById("product-search");
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });

  // Filter buttons
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-category");
      renderProducts();
    });
  });

  // Mobile navigation drawer toggle
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
      navLinks.style.flexDirection = "column";
      navLinks.style.position = "absolute";
      navLinks.style.top = "80px";
      navLinks.style.left = "0";
      navLinks.style.width = "100%";
      navLinks.style.background = "#FAF9F6";
      navLinks.style.padding = "20px";
      navLinks.style.borderBottom = "1px solid var(--border-light)";
    });
  }
}

// Slide-Over Detail Panel Logic (Handles Click Hydration from DOM)
function openDetails(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const panel = document.getElementById("details-panel");
  const content = panel.querySelector(".panel-content");
  
  let ratingBars = "";
  for (const [key, val] of Object.entries(product.metrics)) {
    ratingBars += `
      <div class="rating-bar-row">
        <div class="rating-bar-label">
          <span>${key}</span>
          <span>${val}%</span>
        </div>
        <div class="rating-bar-outer">
          <div class="rating-bar-inner" style="width: ${val}%"></div>
        </div>
      </div>
    `;
  }

  content.innerHTML = `
    <button class="close-panel-btn" onclick="closeDetails()">&times;</button>
    <img src="${product.image}" class="panel-img" alt="${product.name}">
    <span class="panel-brand">${product.brand}</span>
    <h2 class="panel-title">${product.name}</h2>
    <p class="panel-desc">${product.description}</p>
    
    <div class="rating-bar-group">
      <h3 style="margin-bottom: 15px; font-size:1.3rem;">Performance Ratings</h3>
      ${ratingBars}
    </div>

    <div class="panel-actions">
      <a href="${product.link}" target="_blank" class="btn btn-primary">Buy Direct From Manufacturer</a>
      <button class="btn btn-outline" onclick="closeDetails()">Close Reviews</button>
    </div>
  `;

  panel.style.display = "block";
  setTimeout(() => panel.classList.add("open"), 10);
}

function closeDetails() {
  const panel = document.getElementById("details-panel");
  panel.classList.remove("open");
  setTimeout(() => panel.style.display = "none", 400);
}

// Lead Gen Skin Routine Quiz Logic
let quizStep = 0;
const quizData = {
  skinType: "",
  primaryConcern: "",
  budget: "",
  email: ""
};

const quizQuestions = [
  {
    title: "What is your primary skin type?",
    key: "skinType",
    options: ["Oily / Combination", "Dry / Flaky", "Sensitive / Irritated", "Normal / Balanced"]
  },
  {
    title: "What is your main skin concern?",
    key: "primaryConcern",
    options: ["Acne & Breakouts", "Aging & Fine Lines", "Dullness & Dark Spots", "Dehydration"]
  },
  {
    title: "What is your preferred product standard budget?",
    key: "budget",
    options: ["Budget-Friendly (Drugstore)", "Premium Luxury (High-End)", "Clean & Organic Only"]
  }
];

function startQuiz() {
  document.getElementById("quiz-intro").style.display = "none";
  document.getElementById("quiz-questions").style.display = "block";
  quizStep = 0;
  showQuestion();
}

function showQuestion() {
  const q = quizQuestions[quizStep];
  document.getElementById("question-title").innerText = q.title;
  
  // Progress Bar
  const progPercent = ((quizStep + 1) / quizQuestions.length) * 100;
  document.getElementById("quiz-progress").style.width = `${progPercent}%`;

  const optionsContainer = document.getElementById("quiz-options");
  optionsContainer.innerHTML = "";
  
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt-btn";
    btn.innerText = opt;
    btn.onclick = () => selectOption(q.key, opt);
    optionsContainer.appendChild(btn);
  });
}

function selectOption(key, value) {
  quizData[key] = value;
  quizStep++;
  
  if (quizStep < quizQuestions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz-questions").style.display = "none";
    document.getElementById("quiz-email").style.display = "block";
  }
}

function submitQuiz(event) {
  event.preventDefault();
  quizData.email = document.getElementById("lead-email").value;
  
  document.getElementById("quiz-email").style.display = "none";
  document.getElementById("quiz-result").style.display = "block";
  
  showQuizResults();
}

function showQuizResults() {
  const container = document.getElementById("quiz-recommendations");
  container.innerHTML = "";
  
  // Filter products based on concerns/budget
  let matches = [];
  if (quizData.budget.includes("Budget")) {
    matches = PRODUCTS.filter(p => {
      const priceNum = parseInt(p.price.replace(/[^\d]/g, ""));
      return !isNaN(priceNum) && priceNum <= 20;
    });
  } else if (quizData.budget.includes("Clean")) {
    matches = PRODUCTS.filter(p => p.category === "clean");
  } else {
    matches = PRODUCTS.filter(p => {
      const priceNum = parseInt(p.price.replace(/[^\d]/g, ""));
      return !isNaN(priceNum) && priceNum > 20;
    });
  }
  
  if (matches.length === 0 && PRODUCTS.length > 0) {
    matches = [PRODUCTS[0], PRODUCTS[Math.min(3, PRODUCTS.length - 1)]]; // Fallbacks
  }

  matches.forEach(p => {
    const card = document.createElement("div");
    card.className = "recommendation-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="recommendation-info">
        <span style="font-size:0.7rem; color:var(--color-rose-gold); text-transform:uppercase; font-weight:600;">${p.brand}</span>
        <h4>${p.name}</h4>
        <p>${p.price} • Recommended for ${quizData.primaryConcern}</p>
      </div>
      <a href="${p.link}" target="_blank" class="btn btn-sm btn-primary">Buy Direct</a>
    `;
    container.appendChild(card);
  });
}

function resetQuiz() {
  document.getElementById("quiz-result").style.display = "none";
  document.getElementById("quiz-intro").style.display = "block";
}

// Ingredient Decoder Logic
function decodeIngredients() {
  const text = document.getElementById("decoder-text").value.toLowerCase();
  const output = document.getElementById("decoder-output");
  output.innerHTML = "";

  if (!text.trim()) {
    output.innerHTML = `<div style="text-align:center; color:var(--color-text-muted);">Please paste ingredients first!</div>`;
    return;
  }

  // Parse string by commas
  const list = text.split(",").map(i => i.trim()).filter(i => i.length > 0);
  const resultsDiv = document.createElement("div");
  resultsDiv.className = "decoder-results";
  
  let foundMatch = false;

  list.forEach(ing => {
    // Find direct or partial match
    let matchKey = Object.keys(INGREDIENTS_DB).find(key => ing.includes(key));
    
    if (matchKey) {
      foundMatch = true;
      const data = INGREDIENTS_DB[matchKey];
      const card = document.createElement("div");
      card.className = "ingredient-badge";
      card.innerHTML = `
        <div>
          <span class="ing-name" style="text-transform: capitalize;">${ing}</span>
          <p style="font-size:0.75rem; margin-top:2px;">${data.function} - ${data.note}</p>
        </div>
        <span class="ing-safety ${data.safety}">${data.safety}</span>
      `;
      resultsDiv.appendChild(card);
    }
  });

  if (!foundMatch) {
    output.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <p>No active/hazard-notable ingredients recognized in this batch. (Standard moisturizers or emollients recognized).</p>
      </div>
    `;
  } else {
    const title = document.createElement("h3");
    title.innerText = "Decoded Ingredients";
    output.appendChild(title);
    output.appendChild(resultsDiv);
  }
}

// Admin Link Helper Modal Logic
function openAdminTool() {
  document.getElementById("admin-modal").style.display = "flex";
}

function closeAdminTool() {
  document.getElementById("admin-modal").style.display = "none";
}

// Generates parameterized affiliate URLs
function generateLink() {
  const url = document.getElementById("dest-url").value;
  const network = document.getElementById("network-select").value;
  const campaign = document.getElementById("campaign-id").value || "organic";

  if (!url) {
    alert("Please enter a valid brand URL.");
    return;
  }

  let finalUrl = "";
  const cleanUrl = encodeURIComponent(url);

  if (network === "impact") {
    finalUrl = `https://brand.sjv.io/c/392948/${campaign}/?u=${cleanUrl}`;
  } else if (network === "awin") {
    finalUrl = `https://www.awin1.com/cread.php?awinmid=12345&clickref=${campaign}&ued=${cleanUrl}`;
  } else {
    finalUrl = `https://www.anrdoezrs.net/click-998822-112233?sid=${campaign}&url=${cleanUrl}`;
  }

  document.getElementById("aff-result").value = finalUrl;
  document.getElementById("generated-box").style.display = "block";
}

function copyGeneratedLink() {
  const input = document.getElementById("aff-result");
  input.select();
  document.execCommand("copy");
  alert("Affiliate URL copied to clipboard! Ready to post.");
}

// Floating Conversational AI Stylist Chatbot Logic
function toggleChat() {
  const win = document.getElementById("chat-window");
  win.style.display = win.style.display === "none" ? "flex" : "none";
  
  // Clear notification badge
  const badge = document.querySelector(".chat-badge");
  if (badge) badge.style.display = "none";
}

function loadInitialChat() {
  // Simulate delay for a notifications trigger
  setTimeout(() => {
    const badge = document.querySelector(".chat-badge");
    if (badge) badge.style.display = "flex";
  }, 3000);
}

function handleChatPress(event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
}

function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";

  setTimeout(() => {
    let reply = "I can help you with that! Are you looking for a skincare routine or a cosmetics dupe today?";
    const norm = text.toLowerCase();
    
    if (norm.includes("dry") || norm.includes("hydration")) {
      reply = "For dry skin, I highly recommend the **Clinique Moisture Surge 100H** (£42) for deep hydration. Or, if you want a budget option, **The Ordinary Natural Moisturizing Factors** (£6) is an excellent standard cream!";
    } else if (norm.includes("dupe") || norm.includes("charlotte") || norm.includes("filter")) {
      reply = "Ah, looking for dupes! The absolute best match is the **e.l.f. Halo Glow Liquid Filter** (£15) which is a 94% formula match to Charlotte Tilbury's Flawless Filter (£39). You save £24! You can find them in the Dupe Matrix on our main page.";
    } else if (norm.includes("acne") || norm.includes("breakout") || norm.includes("oily")) {
      reply = "For oily or acne-prone skin, **The Ordinary Niacinamide 10% + Zinc 1%** (£6) is fantastic. It controls sebum and refines pores. Remember to purchase directly from their official site using the links on our shelf to ensure original product quality.";
    } else if (norm.includes("original") || norm.includes("authentic") || norm.includes("scam")) {
      reply = "To ensure 100% original product authenticity, our website always redirects you directly to the manufacturer's official online store. We do not use third-party resellers.";
    }
    
    appendMessage("system", reply);
  }, 1000);
}

function appendMessage(sender, text) {
  const box = document.getElementById("chat-messages");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerHTML = text;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}
