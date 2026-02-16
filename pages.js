$(function () {
  function t(text) {
    return window.WM_I18N && typeof window.WM_I18N.t === "function" ? window.WM_I18N.t(text) : text;
  }

  function translatePage() {
    if (window.WM_I18N && typeof window.WM_I18N.translatePage === "function") {
      window.WM_I18N.translatePage();
    }
  }

  var keys = {
    cart: "wm_demo_cart",
    wishlist: "wm_demo_wishlist",
    coupon: "wm_demo_coupon",
    orders: "wm_demo_orders"
  };

  var products = {
    1: { name: '14" Everyday Laptop, 8GB RAM', price: 329 },
    2: { name: "Noise-Reducing Wireless Headphones", price: 49 },
    3: { name: "Ergonomic Office Chair", price: 119 },
    4: { name: "Stainless Steel Electric Kettle", price: 24 },
    5: { name: "Creative Building Blocks Set", price: 19 },
    6: { name: "Smart Fitness Watch", price: 79 },
    7: { name: "4K UHD 55-inch Smart TV", price: 299 },
    8: { name: "Robot Vacuum Cleaner", price: 169 },
    9: { name: "Premium Protein Powder", price: 34 },
    10: { name: "Kids Kick Scooter", price: 58 },
    11: { name: "Air Fryer 5L", price: 64 },
    12: { name: "Gaming Mechanical Keyboard", price: 59 },
    13: { name: "Cordless Hand Blender", price: 22 },
    14: { name: "Resistance Band Set", price: 18 },
    15: { name: "STEM Learning Kit", price: 29 },
    16: { name: "Bluetooth Portable Speaker", price: 39 },
    17: { name: "Ultra HD Monitor 34-inch", price: 1000 },
    18: { name: "Professional Espresso Machine", price: 2000 },
    19: { name: "Luxury Massage Chair", price: 10000 },
    20: { name: "Industrial CNC Machine", price: 20000 }
  };

  if (Array.isArray(window.WM_PRODUCTS) && window.WM_PRODUCTS.length) {
    window.WM_PRODUCTS.forEach(function (p) {
      if (!p || !p.id) return;
      products[p.id] = {
        name: p.name || (products[p.id] && products[p.id].name) || "Product",
        price: Number(p.price) || 0,
        image: p.image || (products[p.id] && products[p.id].image) || ""
      };
    });
  }

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function money(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function summary(cart, coupon) {
    var subtotal = 0;
    Object.keys(cart).forEach(function (id) {
      if (products[id]) subtotal += products[id].price * Number(cart[id]);
    });
    var discount = coupon === "SAVE10" ? subtotal * 0.1 : 0;
    return { subtotal: subtotal, discount: discount, total: subtotal - discount };
  }

  function isVisaMethodLabel(text) {
    var normalized = String(text || "").trim().toLowerCase();
    return normalized.indexOf("visa") !== -1 ||
      normalized.indexOf("فيزا") !== -1;
  }

  function hasVisaOnlyItems(cart) {
    return Object.keys(cart).some(function (id) {
      return !!(products[id] && Number(products[id].price) > 10000);
    });
  }

  function hasFreeDeliveryItems(cart) {
    return Object.keys(cart).some(function (id) {
      return !!(products[id] && Number(products[id].price) >= 1000);
    });
  }

  function renderCheckoutPriceRules(cart) {
    var $freeRule = $("#checkoutFreeDeliveryRule");
    var $visaRule = $("#checkoutVisaOnlyRule");
    if (!$freeRule.length && !$visaRule.length) return;

    var freeDelivery = hasFreeDeliveryItems(cart);
    var visaOnly = hasVisaOnlyItems(cart);

    if ($freeRule.length) {
      $freeRule.toggleClass("d-none", !freeDelivery);
      $freeRule.find(".checkout-rule-text").text(t("You are getting FREE shipping!"));
    }

    if ($visaRule.length) {
      $visaRule.toggleClass("d-none", !visaOnly);
      $visaRule.find(".checkout-rule-text").text(t("For products above $10,000, payment is available by Visa only."));
    }
  }

  function syncStandaloneCheckoutPaymentRestrictions() {
    var $payment = $('#checkoutStandaloneForm select[name="payment"]');
    if (!$payment.length) return;

    var cart = read(keys.cart, {});
    var restricted = hasVisaOnlyItems(cart);
    var $options = $payment.find("option");
    var $visaOption = $options.filter(function () {
      return isVisaMethodLabel($(this).text()) || isVisaMethodLabel($(this).val());
    }).first();

    $options.each(function () {
      var $option = $(this);
      var isPlaceholder = !$option.val();
      if (!restricted || isPlaceholder) {
        $option.prop("disabled", false);
        return;
      }

      var isVisa = isVisaMethodLabel($option.text()) || isVisaMethodLabel($option.val());
      $option.prop("disabled", !isVisa);
    });

    if (restricted) {
      var selectedValue = String($payment.val() || "");
      var selectedText = $payment.find("option:selected").text();
      var selectedIsVisa = isVisaMethodLabel(selectedValue) || isVisaMethodLabel(selectedText);
      if (!selectedIsVisa) {
        $payment.val($visaOption.length ? ($visaOption.val() || $visaOption.text()) : "");
      }
    }
  }

  function renderWishlistPage() {
    var $root = $("#wishlistPageItems");
    if (!$root.length) return;

    var wishlist = read(keys.wishlist, []);
    if (!wishlist.length) {
      $root.html('<p class="text-muted mb-0">' + t("Your wishlist is empty.") + ' <a href="shop.html">' + t("Browse products") + '</a>.</p>');
      return;
    }

    var html = wishlist.map(function (id) {
      var p = products[id];
      if (!p) return "";
      return '<div class="line-item mb-2 p-2 rounded-3 d-flex justify-content-between align-items-center"><div><div class="fw-semibold small">' + p.name + '</div><div class="small text-muted">' + money(p.price) + '</div></div><div class="d-flex gap-1"><button class="btn btn-sm btn-outline-primary move-wishlist-cart" data-id="' + id + '">' + t("Move to cart") + '</button><button class="btn btn-sm btn-outline-secondary remove-wishlist-page" data-id="' + id + '">' + t("Remove") + '</button></div></div>';
    }).join("");

    $root.html(html);
  }

  function renderCartPage() {
    var $root = $("#cartPageItems");
    if (!$root.length) return;

    var cart = read(keys.cart, {});
    var coupon = localStorage.getItem(keys.coupon) || "";

    var ids = Object.keys(cart);
    if (!ids.length) {
      $root.html('<p class="text-muted mb-0">' + t("Your cart is empty.") + ' <a href="shop.html">' + t("Start shopping") + '</a>.</p>');
    } else {
      var html = ids.map(function (id) {
        var p = products[id];
        if (!p) return "";
        var qty = Number(cart[id]);
        var img = p.image || "https://picsum.photos/seed/cart/140/120";
        return [
          '<div class="cart-line">',
          '  <div class="cart-line-media">',
          '    <img src="' + img + '" alt="' + p.name + '">',
          '  </div>',
          '  <div class="cart-line-body">',
          '    <div class="d-flex justify-content-between gap-2 flex-wrap">',
          '      <div>',
          '        <div class="fw-semibold">' + p.name + '</div>',
          '        <div class="small text-muted">' + t("Sold & shipped by SAFQQA") + '</div>',
          '      </div>',
          '      <div class="text-end">',
          '        <div class="fw-semibold">' + money(p.price) + '</div>',
          '        <div class="small text-muted">(' + qty + ' ' + t("item") + ')</div>',
          '      </div>',
          '    </div>',
          '    <div class="cart-line-meta">',
          '      <div class="meta-pill">' + t("1000+ bought since yesterday") + '</div>',
          '      <div class="meta-pill">' + t("Best seller") + '</div>',
          '    </div>',
          '    <div class="cart-line-actions">',
          '      <button class="btn btn-sm btn-link text-muted remove-cart-page" data-id="' + id + '">' + t("Remove") + '</button>',
          '      <button class="btn btn-sm btn-link text-muted">' + t("Save for later") + '</button>',
          '      <div class="qty-stepper">',
          '        <button class="btn btn-light btn-sm dec-cart-page" data-id="' + id + '">-</button>',
          '        <span>' + qty + '</span>',
          '        <button class="btn btn-light btn-sm inc-cart-page" data-id="' + id + '">+</button>',
          '      </div>',
          '      <div class="line-total">' + money(p.price * qty) + '</div>',
          '    </div>',
          '  </div>',
          '</div>'
        ].join("");
      }).join("");
      $root.html(html);
    }

    var s = summary(cart, coupon);
    $("#cartPageSubtotal").text(money(s.subtotal));
    $("#cartPageDiscount").text("-" + money(s.discount));
    $("#cartPageTotal").text(money(s.total));
    $("#couponPageInput").val(coupon);
    $("#cartPageCount").text("(" + Object.keys(cart).length + " " + t("items") + ")");
  }

  function renderCheckoutPage() {
    var $box = $("#checkoutSummaryItems");
    if (!$box.length) return;

    var cart = read(keys.cart, {});
    var coupon = localStorage.getItem(keys.coupon) || "";
    var lines = Object.keys(cart).map(function (id) {
      var p = products[id];
      if (!p) return "";
      return '<div class="d-flex justify-content-between mb-1"><span>' + p.name + ' x' + cart[id] + '</span><b>' + money(p.price * Number(cart[id])) + '</b></div>';
    }).join("");

    $box.html(lines || '<p class="mb-0 text-muted">' + t("No items in cart.") + '</p>');

    var s = summary(cart, coupon);
    $("#checkoutSubtotal").text(money(s.subtotal));
    $("#checkoutDiscount").text("-" + money(s.discount));
    $("#checkoutTotal").text(money(s.total));
    renderCheckoutPriceRules(cart);
    syncStandaloneCheckoutPaymentRestrictions();
  }

  function renderOrdersPage() {
    var $table = $("#ordersTable tbody");
    if (!$table.length) return;

    var orders = read(keys.orders, []);
    if (!orders.length) {
      $table.html('<tr><td colspan="5" class="text-muted small">' + t("No orders yet.") + '</td></tr>');
      return;
    }

    $table.html(orders.map(function (o) {
      return '<tr><td>#' + o.id + '</td><td>' + o.date + '</td><td><span class="badge text-bg-success">' + t(o.status) + '</span></td><td>' + money(o.total) + '</td><td><button class="btn btn-sm btn-outline-secondary">' + t("Details") + '</button></td></tr>';
    }).join(""));
  }

  function handleForms() {
    $("#contactForm").on("submit", function (e) {
      e.preventDefault();
      $("#contactMessage").text(t("Message sent successfully. Support will contact you soon.")).addClass("text-success");
      this.reset();
    });

    $("#loginForm").on("submit", function (e) {
      e.preventDefault();
      $("#loginMessage").text(t("Signed in successfully.")).addClass("text-success");
    });

    $("#registerForm").on("submit", function (e) {
      e.preventDefault();
      $("#registerMessage").text(t("Account created successfully.")).addClass("text-success");
      this.reset();
    });

    $("#checkoutStandaloneForm").on("submit", function (e) {
      e.preventDefault();
      var cart = read(keys.cart, {});
      var coupon = localStorage.getItem(keys.coupon) || "";
      var s = summary(cart, coupon);
      syncStandaloneCheckoutPaymentRestrictions();

      if (!Object.keys(cart).length) {
        $("#checkoutStandaloneMessage").text(t("Cart is empty.")).addClass("text-danger");
        return;
      }

      var $payment = $(this).find('select[name="payment"]');
      var selectedPayment = String($payment.val() || "");
      var selectedText = $payment.find("option:selected").text();
      if (hasVisaOnlyItems(cart) && !(isVisaMethodLabel(selectedPayment) || isVisaMethodLabel(selectedText))) {
        $("#checkoutStandaloneMessage").text(t("For products above $10,000, payment is available by Visa only. Please select Visa to continue.")).addClass("text-danger");
        return;
      }

      var orders = read(keys.orders, []);
      orders.unshift({
        id: Math.floor(Math.random() * 900000 + 100000),
        date: new Date().toISOString().slice(0, 10),
        status: t("Processing"),
        total: s.total
      });
      write(keys.orders, orders);
      write(keys.cart, {});
      localStorage.setItem(keys.coupon, "");
      this.reset();
      $("#checkoutStandaloneMessage").text(t("Order placed successfully.")).removeClass("text-danger").addClass("text-success");
      renderCheckoutPage();
    });
  }

  $(document).on("click", ".inc-cart-page", function () {
    var id = $(this).data("id");
    var cart = read(keys.cart, {});
    cart[id] = (cart[id] || 0) + 1;
    write(keys.cart, cart);
    renderCartPage();
  });

  $(document).on("click", ".dec-cart-page", function () {
    var id = $(this).data("id");
    var cart = read(keys.cart, {});
    if (!cart[id]) return;
    cart[id] -= 1;
    if (cart[id] <= 0) delete cart[id];
    write(keys.cart, cart);
    renderCartPage();
  });

  $(document).on("click", ".remove-cart-page", function () {
    var id = $(this).data("id");
    var cart = read(keys.cart, {});
    delete cart[id];
    write(keys.cart, cart);
    renderCartPage();
  });

  $(document).on("click", "#pickupToggle", function () {
    var $options = $("#pickupOptions");
    $options.toggleClass("is-collapsed");
    var $icon = $(this).find(".bi-chevron-down, .bi-chevron-up");
    if ($options.hasClass("is-collapsed")) {
      $icon.removeClass("bi-chevron-up").addClass("bi-chevron-down");
    } else {
      $icon.removeClass("bi-chevron-down").addClass("bi-chevron-up");
    }
  });

  $(document).on("click", ".pickup-card", function () {
    $(".pickup-card").removeClass("active");
    $(this).addClass("active");
  });

  $(document).on("click", ".remove-wishlist-page", function () {
    var id = Number($(this).data("id"));
    var wishlist = read(keys.wishlist, []).filter(function (item) { return item !== id; });
    write(keys.wishlist, wishlist);
    renderWishlistPage();
  });

  $(document).on("click", ".move-wishlist-cart", function () {
    var id = Number($(this).data("id"));
    var wishlist = read(keys.wishlist, []).filter(function (item) { return item !== id; });
    var cart = read(keys.cart, {});
    cart[id] = (cart[id] || 0) + 1;
    write(keys.wishlist, wishlist);
    write(keys.cart, cart);
    renderWishlistPage();
  });

  $("#clearWishlistPage").on("click", function () {
    write(keys.wishlist, []);
    renderWishlistPage();
  });

  $("#applyPageCoupon").on("click", function () {
    var code = ($("#couponPageInput").val() || "").trim().toUpperCase();
    if (code && code !== "SAVE10") {
      alert(t("Invalid coupon code"));
      return;
    }
    localStorage.setItem(keys.coupon, code);
    renderCartPage();
  });

  renderWishlistPage();
  renderCartPage();
  renderCheckoutPage();
  renderOrdersPage();
  handleForms();
  translatePage();
});
