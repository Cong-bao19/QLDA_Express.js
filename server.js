const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const methodOverride = require("method-override");
const cors = require("cors"); // Thêm cors
const authRouter = require("./routes/api/auth");
const orderRouter = require("./routes/api/order");
const adminOrderRouter = require("./routes/admin/order");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const accountRoutes = require("./routes/accountRoutes");
const adminMiddleware = require("./middleware/adminMiddleware");
const controlRoutes = require("./routes/controlRoutes");

const app = express();

// Cấu hình CORS
app.use(
  cors({
    origin: "http://localhost:3000", // Điều chỉnh theo port của client
    credentials: true,
  })
);

// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use((req, res, next) => {
  console.log("Session:", req.session);
  next();
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 60 * 1000, // Sửa thành 15 giờ (15 * 60 * 60 * 1000)
  max: 5,
  message: { message: "Too many requests. Try again later." },
});

// Định nghĩa các route API
app.use("/api/auth/register", registerLimiter, authRouter);
app.use("/api/auth", authRouter);
app.use("/api/orders", orderRouter);
app.use("/admin/orders", adminOrderRouter);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/account", accountRoutes);
app.use("/api/control", controlRoutes);
app.use("/api", controlRoutes);
app.use(authRouter);
// Đặt static files SAU các route API để tránh ghi đè
app.use(express.static(path.join(__dirname, "public")));

// Route cho các file HTML tĩnh
app.get("/account", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "account.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/detail.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "detail.html"));
});

app.get("/orderManage.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "orderManage.html"));
});

app.get("/orderManager.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "orderManager.html"));
});

app.get("/orderTransit.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "orderTransit.html"));
});

app.get("/orderDelivered.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "orderDelivered.html"));
});

app.get("/orderCancelled.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "orderCancelled.html"));
});

app.get("/OrderDetailUser.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "detailOder.html"));
});

app.get("/order_manage.html", adminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "order_manage.html"));
});

app.get("/cus_manage.html", adminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cus_manage.html"));
});

app.get("/control.html", adminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "control.html"));
});

app.get("/create_product", adminMiddleware, (req, res) => {
  res.render("create_product");
});

const ProductModel = require("./models/productModel");

app.get("/update_product/:id", adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await ProductModel.getProductById(productId);
    if (!product) {
      return res.status(404).send("Sản phẩm không tồn tại");
    }
    res.render("update_product", { product });
  } catch (error) {
    console.error("Error fetching product for update:", error);
    res.status(500).send("Lỗi server");
  }
});

// Xử lý lỗi toàn cục
// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(`Error at ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
  });
  res.status(500).json({ error: "Lỗi server", details: err.message });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
