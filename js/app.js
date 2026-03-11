// ============================================
// TechHub E-Commerce Application
// Modern, clean ES6+ JavaScript structure
// ============================================

let products = [];
let cart = [];
const STORAGE_KEY = "techhub-cart-modern";
const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 50;

// دالة مسؤولة عن جلب قائمة المنتجات من ملف البيانات وتهيئة أقسام الصفحة المختلفة بناءً على محتوى الصفحة الحالية
async function fetchProducts() {
    try {
        const response = await fetch("data/products.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        products = data.products;

        loadCartFromStorage();
        updateCartBadge();

        if (document.getElementById("featured-grid")) initHome();
        if (document.getElementById("products-grid")) initShop();
        if (document.getElementById("main-image")) initProduct();
        if (document.getElementById("cart-items-list")) initCart();
        if (document.getElementById("contact-form")) initContact();
    } catch (error) {
        console.error("Error fetching products:", error);
        showNotification("حدث خطأ في تحميل المنتجات. يرجى تحديث الصفحة.");
    }
}

// دالة مسؤولة عن تهيئة المتجر عند اكتمال تحميل هيكل صفحة الـ HTML
function initializeApp() {
    document.addEventListener("DOMContentLoaded", () => {
        loadCartFromStorage();
        updateCartBadge();
        fetchProducts();
        setupMobileMenu();
    });
}
initializeApp();

// دالة مسؤولة عن فتح وإغلاق القائمة الجانبية للهاتف المحمول عند الضغط على زر المينيو
function setupMobileMenu() {
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.querySelector(".navbar__menu");
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("active");
            mobileBtn.classList.toggle("active");
        });
    }
}

// دالة مسؤولة عن تحديث الرقم الظاهر فوق أيقونة سلة التسوق ليعكس إجمالي كمية المنتجات
function updateCartBadge() {
    const badges = document.querySelectorAll("#cart-count");
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

    badges.forEach((badge) => {
        badge.textContent = totalQuantity;
        if (totalQuantity > 0) {
            badge.classList.add("pulse-anim");
            setTimeout(() => badge.classList.remove("pulse-anim"), 300);
        }
    });
}

// دالة مسؤولة عن حفظ بيانات سلة التسوق الحالية في التخزين المحلي للمتصفح (LocalStorage)
function saveCartToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

// دالة مسؤولة عن استرجاع بيانات سلة التسوق من التخزين المحلي عند تحميل الصفحة
function loadCartFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
}

// دالة مسؤولة عن إنشاء كود HTML الخاص ببطاقة المنتج الواحدة لعرضه في الشبكة
function createProductCard(product) {
    const ratingStars = "★".repeat(Math.round(product.rating)) + "☆".repeat(5 - Math.round(product.rating));
    const badgeHtml = product.isNew ? '<span class="product-card__badge">New</span>' : '';
    const imgUrl = product.images ? product.images[0] : (product.image || 'https://via.placeholder.com/300');

    return `
        <article class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="product-card__image-wrapper">
                <img src="${imgUrl}" alt="${product.name}" class="product-card__image" loading="lazy">
                ${badgeHtml}
            </div>
            <div class="product-card__content">
                <span class="product-card__category">${product.category}</span>
                <h3 class="product-card__title">${product.name}</h3>
                <div class="product-card__rating">
                    <span class="stars">${ratingStars}</span> 
                    <span class="reviews">(${product.reviews})</span>
                </div>
                <div class="product-card__footer">
                    <span class="product-card__price">$${product.price.toFixed(2)}</span>
                    <button class="btn btn--primary btn--icon" aria-label="Add to cart" onclick="event.stopPropagation(); addToCart(${product.id}, 1)">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 2h1l1.5 9h10l1-5h-12l-1-2h14v1l-2 10h-11l-1.5-13z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
                    </button>
                </div>
            </div>
        </article>
    `;
}

// دالة مسؤولة عن إعداد وتجهيز عناصر الصفحة الرئيسية مثل المنتجات المميزة والبحث والنشرة البريدية
function initHome() {
    displayFeaturedProducts();
    setupSearchToggle();
    setupNewsletterForm();
}

// دالة مسؤولة عن عرض قائمة محددة من المنتجات في قسم "المنتجات المميزة" ضمن الصفحة الرئيسية
function displayFeaturedProducts() {
    const featured = products.slice(0, 8);
    const grid = document.getElementById("featured-grid");
    if (grid) {
        grid.innerHTML = featured.map((p) => createProductCard(p)).join("");
    }
}

// دالة مسؤولة عن تجهيز صفحة المتجر، وإعداد الفلاتر، وتطبيق أي عمليات بحث قادمة من روابط أخرى
function initShop() {
    setupSearchToggle();
    setupFilters();
    displayProducts(products);

    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("search");
    if (searchQuery) {
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.value = searchQuery;
            searchInput.dispatchEvent(new Event('input'));
        }
    }
}

// دالة مسؤولة عن ربط الأحداث (Events) بعناصر فلترة المنتجات (السعر والتقييمات والتصنيفات)
function setupFilters() {
    const categoryCheckboxes = document.querySelectorAll('[data-filter="category"]');
    const priceRange = document.getElementById("price-range");
    const sortSelect = document.getElementById("sort-select");
    const clearBtn = document.getElementById("clear-filters");

    categoryCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", applyFilters));

    if (priceRange) {
        priceRange.addEventListener("input", (e) => {
            const priceVal = document.getElementById("price-value");
            if (priceVal) priceVal.textContent = `$${e.target.value}`;
            applyFilters();
        });
    }

    if (sortSelect) sortSelect.addEventListener("change", applyFilters);

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            categoryCheckboxes.forEach((cb) => (cb.checked = cb.value === "all"));
            if (priceRange) {
                priceRange.value = 500;
                document.getElementById("price-value").textContent = "500";
            }
            if (sortSelect) sortSelect.value = "featured";
            applyFilters();
        });
    }
}

// دالة مسؤولة عن تطبيق كافة الفلاتر والبحث على قائمة المنتجات وتحديث واجهة المستخدم بنتيجة الفلترة
function applyFilters() {
    let filtered = [...products];

    const checkedInputs = Array.from(document.querySelectorAll('[data-filter="category"]:checked'));
    const checkedValues = checkedInputs.map((c) => c.value).filter((v) => v !== "all");

    if (checkedValues.length > 0) {
        filtered = filtered.filter((p) => checkedValues.includes(p.category));
    }

    const priceRange = document.getElementById("price-range");
    if (priceRange) {
        const maxPrice = parseFloat(priceRange.value);
        filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
        switch (sortSelect.value) {
            case "price-low":
                filtered.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                filtered.sort((a, b) => b.price - a.price);
                break;
            case "newest":
                filtered.reverse();
                break;
        }
    }

    const searchInput = document.getElementById("search-input");
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
    }

    displayProducts(filtered);
}

// دالة مسؤولة عن توليد كود الـ HTML لقائمة المنتجات الممررة وعرضها في عنصر الشبكة (Grid)
function displayProducts(list) {
    const grid = document.getElementById("products-grid");
    const count = document.getElementById("product-count");
    const noProducts = document.getElementById("no-products");

    if (!grid) return;

    if (list.length === 0) {
        grid.style.display = "none";
        if (noProducts) noProducts.style.display = "flex";
        if (count) count.textContent = "0 Products Found";
    } else {
        grid.style.display = "grid";
        if (noProducts) noProducts.style.display = "none";
        grid.innerHTML = list.map((p) => createProductCard(p)).join("");
        if (count) count.textContent = `Showing ${list.length} Products`;
    }
}

// دالة مسؤولة عن تهيئة صفحة تفاصيل المنتج واستخراج معرف المنتج من الرابط الإلكتروني وعرضه
function initProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get("id")) || 1;
    displayProductDetail(productId);
}

// دالة مسؤولة عن إظهار بيانات المنتج المختار وتحديث كافة النصوص والصور الموجودة في صفحة التفاصيل
function displayProductDetail(id) {
    const product = products.find((p) => p.id === id);
    if (!product) {
        showNotification("المنتج غير موجود (Product not found)");
        setTimeout(() => (window.location.href = "shop.html"), 2000);
        return;
    }

    document.title = `${product.name} | TechHub Desktop`;

    setElementText("product-title", product.name);
    setElementText("product-stars", "★".repeat(Math.round(product.rating)) + "☆".repeat(5 - Math.round(product.rating)));
    setElementText("review-count", `(${product.reviews} reviews)`);
    setElementText("product-price", `$${product.price.toFixed(2)}`);
    setElementText("product-description", product.description);
    setElementText("product-sku", product.sku || "N/A");

    const stockEl = document.getElementById("product-stock");
    if (stockEl) {
        stockEl.textContent = product.inStock !== false ? "In Stock" : "Out of Stock";
        stockEl.className = `stock-status stock-status--${product.inStock !== false ? "in" : "out"}`;
    }

    const mainImg = document.getElementById("main-image");
    const imagesToUse = product.images || [product.image || 'https://via.placeholder.com/600'];
    if (mainImg) mainImg.src = imagesToUse[0];

    const thumbs = document.getElementById("gallery-thumbs");
    if (thumbs) {
        thumbs.innerHTML = imagesToUse.map((img, i) => `
            <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${img}')">
                <img src="${img}" alt="Product thumbnail ${i + 1}">
            </div>
        `).join("");
    }

    const specsList = document.getElementById("product-specs");
    if (specsList && product.specs) {
        specsList.innerHTML = product.specs.map((s) => `<li>${s}</li>`).join("");
    }

    const related = products.filter((p) => p.category === product.category && p.id !== id).slice(0, 4);
    const relatedContainer = document.getElementById("related-products");
    if (relatedContainer) {
        relatedContainer.innerHTML = related.map((p) => createProductCard(p)).join("");
    }

    const addBtn = document.getElementById("add-to-cart-btn");
    if (addBtn) {
        addBtn.onclick = () => {
            const qtyInput = document.getElementById("qty-input");
            const qty = qtyInput ? parseInt(qtyInput.value) : 1;
            addToCart(id, qty);
        };
    }

    const increaseBtn = document.getElementById("qty-increase");
    const decreaseBtn = document.getElementById("qty-decrease");
    const qtyInput = document.getElementById("qty-input");

    if (increaseBtn && qtyInput) {
        increaseBtn.onclick = () => { qtyInput.value = Math.min(99, parseInt(qtyInput.value) + 1); };
    }
    if (decreaseBtn && qtyInput) {
        decreaseBtn.onclick = () => { qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1); };
    }
}

// دالة مسؤولة عن تعيين أو تغيير النص الداخلي (Text Content) لعنصر بـ ID محدد
function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// دالة مسؤولة عن تغيير الصورة الرئيسية للمنتج عند الضغط على إحدى الصور المصغرة
function changeMainImage(elem, src) {
    const mainImg = document.getElementById("main-image");
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('.gallery-thumb').forEach(thumb => thumb.classList.remove('active'));
    elem.classList.add('active');
}

// دالة مسؤولة عن إضافة المنتج المحدد للكمية المختارة إلى مصفوفة السلة وحفظها
function addToCart(productId, quantity = 1) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = cart.find((item) => item.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }

    saveCartToStorage();
    updateCartBadge();
    showNotification(`تم إضافة ${product.name} للسلة بنجاح`);
}

// دالة مسؤولة عن حذف منتج بالكامل من سلة التسوق بناءً على المعرف الخاص به وتحديث الصفحة
function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCartToStorage();
    updateCartBadge();
    if (document.getElementById("cart-items-list")) initCart();
    showNotification("تم إزالة المنتج من السلة");
}

// دالة مسؤولة عن تحديث عدد القطع لمنتج محدد في السلة وإعادة الحساب
function updateCartQuantity(productId, quantity) {
    const item = cart.find((item) => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, parseInt(quantity) || 1);
        saveCartToStorage();
        updateCartBadge();
        if (document.getElementById("cart-items-list")) initCart();
    }
}

// دالة مسؤولة عن تهيئة وعرض محتويات صفحة سلة التسوق وحساب الإجماليات
function initCart() {
    setupSearchToggle();
    const cartTable = document.getElementById("cart-table");
    const emptyCartMsg = document.getElementById("empty-cart-message");
    const cartSummary = document.querySelector(".cart-summary");

    if (cart.length === 0) {
        if (cartTable) cartTable.style.display = "none";
        if (cartSummary) cartSummary.style.display = "none";
        if (emptyCartMsg) emptyCartMsg.style.display = "block";
    } else {
        if (cartTable) cartTable.style.display = "table";
        if (cartSummary) cartSummary.style.display = "flex";
        if (emptyCartMsg) emptyCartMsg.style.display = "none";
        displayCartItems();
    }

    updateCartSummary();
    setupCheckout();
}

// دالة مسؤولة عن إدراج المنتجات ديناميكياً ضمن جدول سلة التسوق
function displayCartItems() {
    const tbody = document.getElementById("cart-items-list");
    if (!tbody) return;

    tbody.innerHTML = cart.map((item) => {
        const imgUrl = item.images ? item.images[0] : (item.image || 'https://via.placeholder.com/100');
        return `
            <tr class="cart-item">
                <td>
                    <div class="cart-item__product">
                        <img src="${imgUrl}" alt="${item.name}" class="cart-item__img">
                        <div class="cart-item__details">
                            <h4 class="cart-item__name">${item.name}</h4>
                            <span class="cart-item__category">${item.category}</span>
                        </div>
                    </div>
                </td>
                <td class="cart-item__price">$${item.price.toFixed(2)}</td>
                <td>
                    <div class="quantity-selector" style="width: max-content;">
                        <button type="button" class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" max="99" class="qty-input" onchange="updateCartQuantity(${item.id}, this.value)">
                        <button type="button" class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </td>
                <td class="cart-item__total">$${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                    <button class="btn btn--icon btn--danger-light cart-item__action" onclick="removeFromCart(${item.id})" aria-label="Remove item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// دالة مسؤولة عن عمل حسابات الضرائب والشحن وإظهار التكلفة النهائية وشريط الشحن المجاني
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 ? 0 : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 10);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shipping + tax;

    setElementText("subtotal", `$${subtotal.toFixed(2)}`);
    setElementText("shipping-cost", shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`);
    setElementText("tax-cost", `$${tax.toFixed(2)}`);
    setElementText("total-price", `$${total.toFixed(2)}`);

    const progressContainer = document.querySelector(".shipping-progress");
    if (!progressContainer) {
        /* Add dynamic progress bar if not existing in html */
        const cartSumm = document.querySelector(".cart-summary");
        if (cartSumm) {
            cartSumm.insertAdjacentHTML('afterbegin', `
                <div class="shipping-progress">
                    <p id="shipping-progress-msg" class="progress-msg"></p>
                    <div class="progress-bar"><div id="shipping-progress-fill" class="progress-bar__fill"></div></div>
                </div>
            `);
        }
    }

    const progressFill = document.getElementById("shipping-progress-fill");
    const progressMsg = document.getElementById("shipping-progress-msg");

    if (progressFill && progressMsg) {
        if (subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0) {
            progressFill.style.width = "100%";
            progressFill.style.backgroundColor = "var(--color-success)";
            progressMsg.textContent = subtotal === 0 ? "Add items to your cart." : "Congratulations! You get free shipping.";
        } else {
            const percentage = (subtotal / FREE_SHIPPING_THRESHOLD) * 100;
            progressFill.style.width = `${percentage}%`;
            progressFill.style.backgroundColor = "var(--brand-primary)";
            const remaining = (FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2);
            progressMsg.innerHTML = `Add <strong>$${remaining}</strong> more for free shipping!`;
        }
    }
}

// دالة مسؤولة عن تهيئة نموذج الدفع (Checkout Modal) وإظهاره أو إخفائه وتنفيذ عملية الطلب
function setupCheckout() {
    const checkoutBtn = document.getElementById("checkout-btn");
    const modal = document.getElementById("checkout-modal");
    const closeBtn = document.getElementById("close-modal");
    const form = document.getElementById("checkout-form");

    if (!checkoutBtn || !modal) return;

    checkoutBtn.onclick = () => {
        if (cart.length === 0) return showNotification("السلة فارغة، لا يمكن المتابعة");
        modal.style.display = "flex";
        setTimeout(() => modal.classList.add("show"), 10);
    };

    const closeModal = () => {
        modal.classList.remove("show");
        setTimeout(() => modal.style.display = "none", 300);
    };

    if (closeBtn) closeBtn.onclick = closeModal;

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            processCheckout();
        };
    }
}

// دالة مسؤولة عن إتمام عملية الشراء بنجاح وإظهار رسالة التأكيد وتفريغ سلة التسوق
function processCheckout() {
    const emailInput = document.getElementById("checkout-email");
    const email = emailInput ? emailInput.value : "customer@techhub.com";
    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

    setElementText("order-id", orderId);
    setElementText("confirmation-email", email);

    const checkoutModal = document.getElementById("checkout-modal");
    if (checkoutModal) {
        checkoutModal.classList.remove("show");
        setTimeout(() => { checkoutModal.style.display = "none"; }, 300);
    }

    const confirmModal = document.getElementById("confirmation-modal");
    if (confirmModal) {
        setTimeout(() => {
            confirmModal.style.display = "flex";
            setTimeout(() => confirmModal.classList.add("show"), 10);
        }, 300);
    }

    const continueBtn = document.getElementById("continue-shopping-btn");
    if (continueBtn) {
        continueBtn.onclick = () => {
            cart = [];
            saveCartToStorage();
            updateCartBadge();
            window.location.href = "shop.html";
        };
    }
}

// دالة مسؤولة عن فتح شريط البحث والتحكم فيه، وتوجيه المستخدم للبحث عند كبس مفتاح Enter
function setupSearchToggle() {
    const toggle = document.getElementById("search-toggle");
    const searchBar = document.getElementById("search-bar");
    const searchInput = document.getElementById("search-input");
    const closeSearch = document.getElementById("close-search"); // if exists

    if (!toggle || !searchBar || !searchInput) return;

    toggle.onclick = () => {
        searchBar.classList.toggle("active");
        if (searchBar.classList.contains("active")) searchInput.focus();
    };

    if (closeSearch) {
        closeSearch.onclick = () => searchBar.classList.remove("active");
    }

    searchInput.oninput = (e) => {
        if (document.getElementById("products-grid")) {
            applyFilters();
        }
    };

    searchInput.onkeypress = (e) => {
        if (e.key === "Enter" && searchInput.value.trim()) {
            if (!document.getElementById("products-grid")) {
                window.location.href = `shop.html?search=${encodeURIComponent(searchInput.value.trim())}`;
            } else {
                searchBar.classList.remove("active");
            }
        }
    };
}

// دالة مسؤولة عن تسجيل البريد الإلكتروني الخاص بالمستخدم في النشرة الإخبارية وعرض رسالة نجاح
function setupNewsletterForm() {
    const forms = document.querySelectorAll(".newsletter");
    forms.forEach((form) => {
        const btn = form.querySelector(".newsletter__btn");
        const input = form.querySelector(".newsletter__input");

        if (btn && input) {
            btn.onclick = (e) => {
                e.preventDefault();
                if (input.value && input.value.includes("@")) {
                    showNotification("Thank you for subscribing to our newsletter!");
                    input.value = "";
                } else {
                    showNotification("Please enter a valid email address.", false);
                }
            };
        }
    });
}

// دالة مسؤولة عن إعداد نموذج اتصل بنا لإرسال استفسارات المستخدم عبر محاكاة عملية الإرسال
function initContact() {
    setupSearchToggle();
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.onsubmit = (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<span class="spinner"></span> Sending...';
        btn.disabled = true;

        setTimeout(() => {
            showNotification("Your message has been sent successfully. We will get back to you soon!");
            form.reset();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    };
}

// دالة مسؤولة عن إظهار الإشعارات والنوافذ المنبثقة المؤقتة لتنبيه المستخدم بالإجراءات الناجحة أو تحذيره
function showNotification(message, isSuccess = true) {
    const oldNotification = document.querySelector(".toast-notification");
    if (oldNotification) oldNotification.remove();

    const div = document.createElement("div");
    div.className = "toast-notification";
    const iconColor = isSuccess ? "var(--color-success)" : "var(--color-danger)";

    div.innerHTML = `
        <div style="display:flex; align-items:center; gap: 1rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: ${iconColor};">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="font-weight:500;">${message}</span>
        </div>
    `;

    document.body.appendChild(div);

    setTimeout(() => div.classList.add("show"), 10);

    setTimeout(() => {
        div.classList.remove("show");
        setTimeout(() => div.remove(), 400);
    }, 4000);
}
