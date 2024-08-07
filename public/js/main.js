document.addEventListener("DOMContentLoaded", () => {
  const productsList = document.getElementById("products-list");
  const cartContents = document.getElementById("cart-contents");
  const cartIcon = document.getElementById("cart-icon");
  const cartPopup = document.getElementById("cart-popup");
  const closePopupBtn = document.getElementById("close-popup-btn");
  const emptyCartBtn = document.getElementById("empty-cart-btn");
  const returnToTopBtn = document.getElementById("return-to-top-btn");

  const toggleCartPop = () => {
    cartPopup.classList.toggle("hidden");
  };

  const loadCart = async () => {
    toggleCartPop();
    await loadCartContents();
  };

  const emptyCart = () => {
    localStorage.removeItem("cart");
    loadCartContents();
    alert("Cart has been emptied.");
  };

  const sanitize = (str) => {
    const element = document.createElement("div");
    element.innerText = str;
    return element.innerHTML;
  };

  const scrollFunction = () => {
    returnToTopBtn.style.display = 
      document.body.scrollTop > 100 || document.documentElement.scrollTop > 100 ? "block" : "none";
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Network response was not ok");
      const products = await response.json();
      productsList.innerHTML = "";
      products.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("product-item");

        productDiv.innerHTML = `
          <div class="product-image-wrapper">
            <img src="${sanitize(product.image_url)}" alt="${sanitize(product.name)}" class="product-image">
          </div>
          <h2 class="prod-name">${sanitize(product.name)}</h2>
          <p class="prod-description">${sanitize(product.description)}</p>
          <p class="prod-price"><b>$${sanitize(product.price.toString())}</b></p>
          <div class="action-container">
            <div class="quantity-selector">
              <button class="decrease-quantity">-</button>
              <input type="number" class="product-quantity" value="1" min="1">
              <button class="increase-quantity">+</button>
            </div>
            <button class="add-to-cart-btn" data-id="${sanitize(product.id.toString())}">Add to Cart</button>
          </div>
        `;
        productsList.appendChild(productDiv);

        const decreaseBtn = productDiv.querySelector(".decrease-quantity");
        const increaseBtn = productDiv.querySelector(".increase-quantity");
        const quantityInput = productDiv.querySelector(".product-quantity");

        decreaseBtn.addEventListener("click", () => {
          if (quantityInput.value > 1) quantityInput.value--;
        });

        increaseBtn.addEventListener("click", () => {
          quantityInput.value++;
        });
      });
      document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
        button.addEventListener("click", addToCart);
      });
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const addToCart = (event) => {
    const productId = event.target.dataset.id;
    const quantityInput = event.target.parentElement.querySelector(".product-quantity");
    const quantity = parseInt(quantityInput.value, 10);
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingProduct = cart.find((item) => item.id === productId);
    if (existingProduct) {
      existingProduct.quantity = quantity;
    } else {
      cart.push({ id: productId, quantity });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCartContents();
    alert("Product added to cart!");
  };

  const loadCartContents = async () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      cartContents.innerHTML = "<p style='font-size: 24px; font-weight: bold;'>Your cart is empty.</p>";
      return;
    }

    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Network response was not ok");
      const allProducts = await response.json();
      const cartProducts = cart.map((item) => {
        const product = allProducts.find((p) => p.id.toString() === item.id);
        return {
          ...product,
          quantity: item.quantity,
          price: parseFloat(product.price),
        };
      });

      cartContents.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${cartProducts
              .map(
                (product) => `
                <tr data-id="${sanitize(product.id.toString())}">
                  <td><b>${sanitize(product.name)}</b></td>
                  <td class="quantity-cell">${sanitize(product.quantity.toString())}</td>
                  <td class="price-cell">$${sanitize(product.price.toFixed(2))}</td>
                  <td class="total-cell">$${sanitize((product.price * product.quantity).toFixed(2))}</td>
                  <td>
                    <button class="decrease-quantity">-</button>
                    <button class="increase-quantity">+</button>
                    <button class="remove-product" title="Remove Product"><i class="fas fa-trash-alt"></i></button>
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <p class="cart-total-price"><strong>Total Price: $${sanitize(
          cartProducts
            .reduce((total, product) => total + product.price * product.quantity, 0)
            .toFixed(2)
        )}</strong></p>
      `;

      document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', adjustQuantity);
      });
      document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', adjustQuantity);
      });
      document.querySelectorAll('.remove-product').forEach(button => {
        button.addEventListener('click', removeFromCart);
      });

      document.getElementById("checkout-btn").addEventListener("click", checkout);
    } catch (error) {
      console.error("Error loading cart contents:", error);
    }
  };

  const checkout = async () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Network response was not ok");
      const allProducts = await response.json();
      const totalPrice = cart.reduce((total, item) => {
        const product = allProducts.find((p) => p.id.toString() === item.id);
        return total + (product ? product.price * item.quantity : 0);
      }, 0);

      await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: cart,
          totalPrice,
        }),
      });

      localStorage.removeItem("cart");
      alert("Order placed successfully!");
      loadCartContents();
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  const adjustQuantity = (event) => {
    const row = event.target.closest('tr');
    const productId = row.dataset.id;
    const quantityCell = row.querySelector('.quantity-cell');
    const priceCell = row.querySelector('.price-cell');
    const totalCell = row.querySelector('.total-cell');

    let quantity = parseInt(quantityCell.textContent, 10);
    const price = parseFloat(priceCell.textContent.replace('$', ''));

    if (event.target.classList.contains('increase-quantity')) {
      quantity++;
    } else if (event.target.classList.contains('decrease-quantity') && quantity > 1) {
      quantity--;
    }

    quantityCell.textContent = quantity;
    totalCell.textContent = `$${(price * quantity).toFixed(2)}`;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProduct = cart.find(i => i.id === productId);
    if (existingProduct) {
      existingProduct.quantity = quantity;
    } else {
      cart.push({ id: productId, quantity });
    }
    localStorage.setItem("cart", JSON.stringify(cart));

    updateTotalPrice();
  };

  const updateTotalPrice = async () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      document.querySelector('#cart-popup p strong').textContent = `Total Price: $0.00`;
      return;
    }

    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Network response was not ok");
      const allProducts = await response.json();
      const totalPrice = cart.reduce((total, item) => {
        const product = allProducts.find(p => p.id.toString() === item.id);
        return total + (product ? product.price * item.quantity : 0);
      }, 0);

      document.querySelector('#cart-popup p strong').textContent = `Total Price: $${totalPrice.toFixed(2)}`;
    } catch (error) {
      console.error("Error updating total price:", error);
    }
  };

  const removeFromCart = (event) => {
    const row = event.target.closest('tr');
    const productId = row.dataset.id;
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    row.remove();
    loadCartContents();
  };

  window.onscroll = scrollFunction;
  closePopupBtn.addEventListener("click", toggleCartPop);
  cartIcon.addEventListener("click", loadCart);
  emptyCartBtn.addEventListener("click", emptyCart);
  returnToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loadProducts();
});
