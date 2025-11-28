// ============================================
// TechHub E-Commerce Application
// ============================================

// Global State
let products = []
let cart = []
const STORAGE_KEY = "techhub-cart"
const TAX_RATE = 0.08
const FREE_SHIPPING_THRESHOLD = 50

// ============================================
// Utilities
// ============================================

async function fetchProducts() {
  try {
    const response = await fetch("data/products.json")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    products = data.products
    
    // Always load cart from storage
    loadCartFromStorage()
    updateCartBadge()

    // Initialize page-specific features
    if (document.getElementById("featured-grid")) initHome()
    if (document.getElementById("products-grid")) initShop()
    if (document.getElementById("main-image")) initProduct()
    if (document.getElementById("cart-items-list")) initCart()
    if (document.getElementById("contact-form")) initContact()
  } catch (error) {
    console.error("Error fetching products:", error)
    showNotification("Error loading products. Please refresh the page.")
  }
}

// Always ensure cart is loaded on all pages
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage()
  updateCartBadge()
  fetchProducts()
})

function updateCartBadge() {
  const badges = document.querySelectorAll("#cart-count")
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  badges.forEach((badge) => {
    badge.textContent = totalQuantity
  })
}

function saveCartToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
}

function loadCartFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY)
  cart = saved ? JSON.parse(saved) : []
}

function createProductCard(product, featured = false) {
  return `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">
            <img src="${product.image}" alt="${product.name}" class="product-card__image" loading="lazy">
            <div class="product-card__content">
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__category">${product.category}</p>
                <div class="product-card__rating">
                    ${"★".repeat(Math.round(product.rating))} (${product.reviews})
                </div>
                <div class="product-card__price">
                    <span class="product-card__price-value">$${product.price.toFixed(2)}</span>
                    <button class="product-card__btn" onclick="event.stopPropagation(); addToCartFromCard(${product.id})">Add</button>
                </div>
            </div>
        </div>
    `
}

// ============================================
// Home Page
// ============================================

function initHome() {
  displayFeaturedProducts()
  setupSearchToggle()
  setupNewsletterForm()
}

function displayFeaturedProducts() {
  const featured = products.slice(0, 6)
  const grid = document.getElementById("featured-grid")
  grid.innerHTML = featured.map((p) => createProductCard(p, true)).join("")
}

// ============================================
// Shop Page
// ============================================

function initShop() {
  setupSearchToggle()
  setupFilters()
  displayAllProducts()
}

function setupFilters() {
  const categoryCheckboxes = document.querySelectorAll('[data-filter="category"]')
  const priceRange = document.getElementById("price-range")
  const sortSelect = document.getElementById("sort-select")
  const clearBtn = document.getElementById("clear-filters")

  categoryCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", applyFilters)
  })

  priceRange.addEventListener("input", (e) => {
    document.getElementById("price-value").textContent = e.target.value
    applyFilters()
  })

  sortSelect.addEventListener("change", applyFilters)

  clearBtn.addEventListener("click", () => {
    categoryCheckboxes.forEach((cb) => {
      cb.checked = cb.value === "all"
    })
    priceRange.value = 500
    document.getElementById("price-value").textContent = 500
    sortSelect.value = "featured"
    applyFilters()
  })
}

function applyFilters() {
  let filtered = [...products]

  // Category filter
  const checked = document.querySelectorAll('[data-filter="category"]:checked')
  const categories = Array.from(checked)
    .map((c) => c.value)
    .filter((v) => v !== "all")
  if (categories.length > 0) {
    filtered = filtered.filter((p) => categories.includes(p.category))
  }

  // Price filter
  const maxPrice = Number.parseFloat(document.getElementById("price-range").value)
  filtered = filtered.filter((p) => p.price <= maxPrice)

  // Sort
  const sort = document.getElementById("sort-select").value
  switch (sort) {
    case "price-low":
      filtered.sort((a, b) => a.price - b.price)
      break
    case "price-high":
      filtered.sort((a, b) => b.price - a.price)
      break
    case "newest":
      filtered.reverse()
      break
  }

  displayProducts(filtered)
}

function displayAllProducts() {
  displayProducts(products)
}

function displayProducts(list) {
  const grid = document.getElementById("products-grid")
  const count = document.getElementById("product-count")
  const noProducts = document.getElementById("no-products")

  if (list.length === 0) {
    grid.style.display = "none"
    noProducts.style.display = "block"
    count.textContent = "0 products"
  } else {
    grid.style.display = "grid"
    noProducts.style.display = "none"
    grid.innerHTML = list.map((p) => createProductCard(p)).join("")
    count.textContent = `${list.length} products`
  }
}

// ============================================
// Product Detail Page
// ============================================

function initProduct() {
  const params = new URLSearchParams(window.location.search)
  const productId = Number.parseInt(params.get("id")) || 1
  displayProductDetail(productId)
}

function displayProductDetail(id) {
  const product = products.find((p) => p.id === id)
  if (!product) {
    showNotification("Product not found")
    setTimeout(() => {
      window.location.href = "shop.html"
    }, 2000)
    return
  }

  document.getElementById("product-title").textContent = product.name
  document.getElementById("product-stars").textContent = "★".repeat(Math.round(product.rating))
  document.getElementById("review-count").textContent = product.reviews
  document.getElementById("product-price").textContent = `$${product.price.toFixed(2)}`
  document.getElementById("product-description").textContent = product.description
  document.getElementById("product-sku").textContent = product.sku
  document.getElementById("product-stock").textContent = product.inStock ? "Yes" : "No"
  document.getElementById("product-stock").className = `stock-status stock-status--${product.inStock ? "in" : "out"}`

  // Image gallery
  document.getElementById("main-image").src = product.images[0]
  const thumbs = document.getElementById("gallery-thumbs")
  thumbs.innerHTML = product.images
    .map(
      (img, i) => `
        <div class="gallery-thumb" onclick="changeMainImage('${img}')">
            <img src="${img}" alt="Product image ${i + 1}">
        </div>
    `,
    )
    .join("")

  // Specs
  const specsList = document.getElementById("product-specs")
  specsList.innerHTML = product.specs.map((s) => `<li>${s}</li>`).join("")

  // Related products
  const related = products.filter((p) => p.category === product.category && p.id !== id).slice(0, 4)
  document.getElementById("related-products").innerHTML = related.map((p) => createProductCard(p)).join("")

  // Add to cart button
  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    const qty = Number.parseInt(document.getElementById("qty-input").value)
    addToCart(id, qty)
  })

  // Quantity controls
  document.getElementById("qty-increase").addEventListener("click", () => {
    const input = document.getElementById("qty-input")
    input.value = Math.min(99, Number.parseInt(input.value) + 1)
  })

  document.getElementById("qty-decrease").addEventListener("click", () => {
    const input = document.getElementById("qty-input")
    input.value = Math.max(1, Number.parseInt(input.value) - 1)
  })
}

function changeMainImage(src) {
  document.getElementById("main-image").src = src
}

// ============================================
// Cart Management
// ============================================

function addToCart(productId, quantity = 1) {
  const product = products.find((p) => p.id === productId)
  if (!product) return

  const existing = cart.find((item) => item.id === productId)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: quantity,
    })
  }

  saveCartToStorage()
  updateCartBadge()
  showNotification(`${product.name} added to cart!`)
}

function addToCartFromCard(productId) {
  addToCart(productId, 1)
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  saveCartToStorage()
  updateCartBadge()
  initCart()
}

function updateCartQuantity(productId, quantity) {
  const item = cart.find((item) => item.id === productId)
  if (item) {
    item.quantity = Math.max(1, Number.parseInt(quantity) || 1)
    saveCartToStorage()
    updateCartBadge()
    initCart()
  }
}

// ============================================
// Cart Page
// ============================================

function initCart() {
  if (cart.length === 0) {
    document.getElementById("cart-table").style.display = "none"
    document.getElementById("empty-cart-message").style.display = "block"
  } else {
    document.getElementById("cart-table").style.display = "table"
    document.getElementById("empty-cart-message").style.display = "none"
    displayCartItems()
  }

  updateCartSummary()
  setupCheckout()
}

function displayCartItems() {
  const tbody = document.getElementById("cart-items-list")
  tbody.innerHTML = cart
    .map(
      (item) => `
        <tr>
            <td>
                <div class="cart-item__product">
                    <img src="${item.image}" alt="${item.name}" class="cart-item__image">
                    <div class="cart-item__info">
                        <div class="cart-item__name">${item.name}</div>
                        <div class="cart-item__category">${item.category}</div>
                    </div>
                </div>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <input type="number" value="${item.quantity}" min="1" max="99" 
                    class="cart-item__qty-input" 
                    onchange="updateCartQuantity(${item.id}, this.value)">
            </td>
            <td><span class="cart-item__total">$${(item.price * item.quantity).toFixed(2)}</span></td>
            <td><button class="cart-item__remove" onclick="removeFromCart(${item.id})">Remove</button></td>
        </tr>
    `,
    )
    .join("")
}

function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 10
  const tax = subtotal * TAX_RATE
  const total = subtotal + shipping + tax

  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`
  document.getElementById("shipping-cost").textContent = shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`
  document.getElementById("tax-cost").textContent = `$${tax.toFixed(2)}`
  document.getElementById("total-price").textContent = `$${total.toFixed(2)}`
}

function setupCheckout() {
  const checkoutBtn = document.getElementById("checkout-btn")
  const modal = document.getElementById("checkout-modal")
  const closeBtn = document.getElementById("close-modal")
  const form = document.getElementById("checkout-form")

  checkoutBtn.addEventListener("click", () => {
    modal.style.display = "flex"
  })

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none"
  })

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
    }
  })

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    processCheckout()
  })
}

function processCheckout() {
  const email = document.getElementById("checkout-email").value
  const orderId = "ORD-" + Date.now()

  document.getElementById("order-id").textContent = orderId
  document.getElementById("confirmation-email").textContent = email

  document.getElementById("checkout-modal").style.display = "none"
  document.getElementById("confirmation-modal").style.display = "flex"

  document.getElementById("continue-shopping-btn").addEventListener("click", () => {
    cart = []
    saveCartToStorage()
    updateCartBadge()
    window.location.href = "shop.html"
  })
}

// ============================================
// Search & Navigation
// ============================================

function setupSearchToggle() {
  const toggle = document.getElementById("search-toggle")
  const searchBar = document.getElementById("search-bar")
  const searchInput = document.getElementById("search-input")

  if (!toggle) return

  toggle.addEventListener("click", () => {
    if (searchBar.style.display === "none") {
      searchBar.style.display = "block"
      searchInput.focus()
    } else {
      searchBar.style.display = "none"
    }
  })

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase()
    const filtered = products.filter(
      (p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query),
    )

    if (document.getElementById("products-grid")) {
      displayProducts(filtered)
    } else if (document.getElementById("featured-grid")) {
      const grid = document.getElementById("featured-grid")
      const results = filtered.slice(0, 6)
      grid.innerHTML = results.map((p) => createProductCard(p)).join("")
    }
  })

  // Search on Enter key
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchInput.value.trim()) {
      if (!document.getElementById("products-grid")) {
        window.location.href = `shop.html?search=${encodeURIComponent(searchInput.value.trim())}`
      }
    }
  })
}

function setupNewsletterForm() {
  const newsletterButtons = document.querySelectorAll(".newsletter__btn")
  newsletterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      const input = btn.previousElementSibling
      if (input && input.value && input.value.includes("@")) {
        showNotification("Thank you for subscribing!")
        input.value = ""
      } else {
        showNotification("Please enter a valid email address")
      }
    })
  })
}

// ============================================
// Contact Page
// ============================================

function initContact() {
  const form = document.getElementById("contact-form")
  if (!form) return

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    showNotification("Thank you for your message! We'll get back to you soon.")
    form.reset()
  })
}

// ============================================
// Utilities
// ============================================

function showNotification(message) {
  const div = document.createElement("div")
  div.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #06d6a0;
        color: #0d0d0d;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 999;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `
  div.textContent = message
  document.body.appendChild(div)

  setTimeout(() => {
    div.remove()
  }, 3000)
}

// Add CSS for notification animation
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`
document.head.appendChild(style)
