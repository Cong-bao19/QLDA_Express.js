const Product = require("../models/productModel");

const productController = {
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy danh sách sản phẩm", error });
    }
  },
  getProductsByPage: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || null;

    try {
      // Giả sử hàm trong model trả về object: { products, totalItems }
      const { products, totalItems } = await Product.getProductsByPage(
        page,
        limit,
        minPrice,
        maxPrice
      );
      res.json({ products, totalItems }); // ✅ đúng định dạng frontend cần
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },
  getProductById: async (req, res) => {
    const productId = req.params.id;
    try {
      const product = await Product.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      res.status(200).json(product);
    } catch (error) {
      console.error("Error fetching product details:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy thông tin sản phẩm", error });
    }
  },
  searchProducts: async (req, res) => {
    try {
      const query = req.query.query || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || null;

      const { products, totalItems } = await Product.searchByKeyword(
        query,
        page,
        limit,
        minPrice,
        maxPrice
      );
      res.json({ products, totalItems });
    } catch (error) {
      console.error("Error in searchProducts:", error);
      res.status(500).json({ message: "Lỗi server", details: error.message });
    }
  },
  createProduct: async (req, res) => {
    try {
      const { pname, pimage, psize, pquantity, pprice, category_id, pdesc } =
        req.body;
      await Product.createProduct({
        pname,
        pimage,
        psize,
        pquantity: parseInt(pquantity),
        pprice: parseFloat(pprice),
        category_id: parseInt(category_id),
        pdesc,
      });
      res.redirect("/pro_manage.html");
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).send("Lỗi khi tạo sản phẩm");
    }
  },
  deleteProduct: async (req, res) => {
    try {
      const productId = req.params.id;
      await Product.deleteProduct(productId);
      res.status(200).json({ message: "Xóa sản phẩm thành công" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
    }
  },
  updateProduct: async (req, res) => {
    try {
      const productId = req.params.id;
      const { pname, pimage, psize, pquantity, pprice, category_id, pdesc } =
        req.body;
      await Product.updateProduct(productId, {
        pname,
        pimage,
        psize,
        pquantity: parseInt(pquantity),
        pprice: parseFloat(pprice),
        category_id: parseInt(category_id),
        pdesc,
      });
      res.redirect("/pro_manage.html");
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).send("Lỗi khi cập nhật sản phẩm");
    }
  },
};

module.exports = productController;
