require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const prisma = new PrismaClient();
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 5555;
const JWT_SECRET = process.env.JWT_SECRET || "development_secret_key";
const PRODUCT_CSV_HEADERS = ["title", "price", "category", "description", "image"];

app.use(cors());
app.use(express.json());

// Checks product manager membership.
function isProductManager(user) {
  return Boolean(user?.productManager);
}

// Returns the user's app role.
function getRole(user) {
  return isProductManager(user) ? "product_manager" : "customer";
}

// Creates a signed login token.
function signToken(user) {
  const role = getRole(user);

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role,
      product_manager: role === "product_manager",
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// Removes private user fields.
function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    profileImage: user.profileImage,
    profileZoom: user.profileZoom,
    profileFocusX: user.profileFocusX,
    profileFocusY: user.profileFocusY,
    role: getRole(user),
    product_manager: isProductManager(user),
  };
}

// Validates optional profile image URLs.
function normalizeProfileImage(value) {
  const profileImage = value?.toString().trim();

  if (!profileImage) {
    return null;
  }

  try {
    const url = new URL(profileImage);
    return ["http:", "https:"].includes(url.protocol) ? profileImage : undefined;
  } catch {
    return undefined;
  }
}

// Clamps profile image crop numbers.
function normalizeProfileCrop(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
}

// Cleans account text fields.
function normalizeAccountField(value) {
  return value?.toString().trim();
}

// Loads the logged-in user from a token.
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  return prisma.user.findUnique({
    where: { id: decoded.id },
    include: { productManager: true },
  });
}

// Blocks requests without a valid login.
async function requireAuthenticated(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ error: "Login required" });
    }

    req.user = toSafeUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Blocks non-product managers.
async function requireProductManager(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user || !isProductManager(user)) {
      return res.status(403).json({ error: "Product manager access required" });
    }

    req.user = toSafeUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Detects comma or tab CSV files.
function detectCsvSeparator(filePath) {
  const file = fs.openSync(filePath, "r");

  try {
    const buffer = Buffer.alloc(4096);
    const bytesRead = fs.readSync(file, buffer, 0, buffer.length, 0);
    const firstLine = buffer.subarray(0, bytesRead).toString("utf8").split(/\r?\n/)[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;

    return tabCount > commaCount ? "\t" : ",";
  } finally {
    fs.closeSync(file);
  }
}

// Standardizes CSV header names.
function normalizeCsvHeader(header) {
  return header.replace(/^\uFEFF/, "").trim().toLowerCase();
}

// Validates required CSV columns.
function validateCsvHeaders(headers) {
  const missingHeaders = PRODUCT_CSV_HEADERS.filter((header) => !headers.includes(header));
  const unexpectedHeaders = headers.filter((header) => !PRODUCT_CSV_HEADERS.includes(header));

  if (missingHeaders.length === 0 && unexpectedHeaders.length === 0) {
    return null;
  }

  return {
    error: [
      "CSV headers are invalid.",
      missingHeaders.length
        ? `Missing required column(s): ${missingHeaders.join(", ")}.`
        : "",
      unexpectedHeaders.length
        ? `Unexpected column(s): ${unexpectedHeaders.join(", ")}.`
        : "",
      `Expected columns: ${PRODUCT_CSV_HEADERS.join(", ")}.`,
    ]
      .filter(Boolean)
      .join(" "),
    expectedHeaders: PRODUCT_CSV_HEADERS,
    missingHeaders,
    unexpectedHeaders,
  };
}

// Converts CSV price text to a number.
function parseCsvPrice(value) {
  const rawValue = value?.toString().trim();

  if (!rawValue) {
    return null;
  }

  // Strips currency text and normalizes separators.
  let cleaned = rawValue.replace(/\s/g, "");
  cleaned = cleaned.replace(/^\((.*)\)$/, "-$1");
  cleaned = cleaned.replace(/[^\d,.-]/g, "");

  if (!/\d/.test(cleaned)) {
    return null;
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    cleaned =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const commaParts = cleaned.split(",");
    const decimalDigits = commaParts.at(-1).length;

    cleaned =
      commaParts.length === 2 && decimalDigits <= 2
        ? cleaned.replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    cleaned = cleaned.replace(/\./g, "");
  }

  const price = Number(cleaned);

  return Number.isFinite(price) ? price : null;
}

// Checks if a CSV row is blank.
function isEmptyCsvRow(row) {
  return Object.values(row).every((value) => !value?.toString().trim());
}

// Builds a CSV row error message.
function buildCsvRowError(row) {
  const missingFields = PRODUCT_CSV_HEADERS.filter((field) => !row[field]?.trim());
  const invalidFields = [];

  if (row.price?.trim() && parseCsvPrice(row.price) === null) {
    invalidFields.push("price must be a number or currency amount");
  }

  const parts = [];

  if (missingFields.length) {
    parts.push(`missing ${missingFields.join(", ")}`);
  }

  if (invalidFields.length) {
    parts.push(invalidFields.join(", "));
  }

  return parts.join("; ");
}

// Returns seller display text.
function getSellerUsername(product) {
  return product.seller?.username || "Unassigned";
}

// Builds product analytics summaries.
function buildProductAnalytics(products) {
  const totalProducts = products.length;
  const totalLikes = products.reduce((total, product) => total + product.likes.length, 0);
  const averagePrice =
    totalProducts > 0
      ? products.reduce((total, product) => total + product.price, 0) / totalProducts
      : 0;
  const categoryMap = new Map();
  const sellerMap = new Map();

  products.forEach((product) => {
    const category = product.category || "Uncategorized";
    const sellerUsername = getSellerUsername(product);

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { category, productCount: 0, totalPrice: 0, totalLikes: 0 });
    }

    if (!sellerMap.has(sellerUsername)) {
      sellerMap.set(sellerUsername, {
        sellerUsername,
        productCount: 0,
        totalPrice: 0,
        totalLikes: 0,
      });
    }

    const categoryStats = categoryMap.get(category);
    const sellerStats = sellerMap.get(sellerUsername);

    categoryStats.productCount += 1;
    categoryStats.totalPrice += product.price;
    categoryStats.totalLikes += product.likes.length;
    sellerStats.productCount += 1;
    sellerStats.totalPrice += product.price;
    sellerStats.totalLikes += product.likes.length;
  });

  return {
    totalProducts,
    totalCategories: categoryMap.size,
    totalLikes,
    averagePrice: Number(averagePrice.toFixed(2)),
    categoryStats: Array.from(categoryMap.values())
      .map((item) => ({
        category: item.category,
        productCount: item.productCount,
        averagePrice: Number((item.totalPrice / item.productCount).toFixed(2)),
        totalLikes: item.totalLikes,
      }))
      .sort((a, b) => b.productCount - a.productCount),
    sellerStats: Array.from(sellerMap.values())
      .map((item) => ({
        sellerUsername: item.sellerUsername,
        productCount: item.productCount,
        averagePrice: Number((item.totalPrice / item.productCount).toFixed(2)),
        totalLikes: item.totalLikes,
      }))
      .sort((a, b) => b.productCount - a.productCount),
    mostLikedProducts: [...products]
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        title: product.title,
        category: product.category,
        price: product.price,
        likes: product.likes.length,
        sellerUsername: getSellerUsername(product),
      })),
    recentProducts: [...products]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        title: product.title,
        category: product.category,
        price: product.price,
        sellerUsername: getSellerUsername(product),
      })),
  };
}

// Registers a new customer.
async function register(req, res) {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Email, username, and password are required" });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      return res.status(400).json({ error: `${field} already in use` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    return res.status(201).json({
      message: "User registered",
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Logs a user in.
async function login(req, res) {
  const email = req.body.email || req.body.emailOrUsername;
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { productManager: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatches =
      (await bcrypt.compare(password, user.password)) || password === user.password;

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (password === user.password) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(password, 10) },
      });
    }

    return res.json({
      message: "Login successful",
      token: signToken(user),
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

app.post("/auth/register", register);
app.post("/register", register);
app.post("/auth/login", login);
app.post("/login", login);

// Returns the latest logged-in user data.
app.get("/auth/me", requireAuthenticated, async (req, res) => {
  return res.json({ user: req.user });
});

// Updates the current user's profile.
app.patch("/auth/profile", requireAuthenticated, async (req, res) => {
  const profileImage = normalizeProfileImage(req.body.profileImage);
  const profileZoom = normalizeProfileCrop(req.body.profileZoom, 1, 3, 1);
  const profileFocusX = normalizeProfileCrop(req.body.profileFocusX, 0, 100, 50);
  const profileFocusY = normalizeProfileCrop(req.body.profileFocusY, 0, 100, 50);

  if (profileImage === undefined) {
    return res.status(400).json({ error: "Profile image must be a valid http or https URL" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        profileImage,
        profileZoom: profileImage ? profileZoom : 1,
        profileFocusX: profileImage ? profileFocusX : 50,
        profileFocusY: profileImage ? profileFocusY : 50,
      },
      include: { productManager: true },
    });

    return res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// Updates the current user's account details.
app.patch("/auth/account", requireAuthenticated, async (req, res) => {
  const email = normalizeAccountField(req.body.email);
  const username = normalizeAccountField(req.body.username);
  const currentPassword = req.body.currentPassword?.toString() || "";
  const newPassword = req.body.newPassword?.toString() || "";

  if (!email || !username) {
    return res.status(400).json({ error: "Username and email are required" });
  }

  if (newPassword && newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { productManager: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: req.user.id },
        OR: [{ email }, { username }],
      },
    });

    if (duplicate) {
      const field = duplicate.email === email ? "Email" : "Username";
      return res.status(400).json({ error: `${field} already in use` });
    }

    const updateData = { email, username };

    if (newPassword) {
      const passwordMatches =
        (await bcrypt.compare(currentPassword, currentUser.password)) ||
        currentPassword === currentUser.password;

      if (!passwordMatches) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: { productManager: true },
    });

    return res.json({
      token: signToken(user),
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Account update error:", err);
    return res.status(500).json({ error: "Failed to update account" });
  }
});

// Lists all products.
app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Creates a product.
app.post("/products", requireProductManager, async (req, res) => {
  try {
    const { title, price, category, description, image } = req.body;
    const parsedPrice = parseCsvPrice(price);

    if (!title || parsedPrice === null || !category || !description || !image) {
      return res.status(400).json({
        error: "Title, numeric price, category, description, and image are required",
      });
    }

    const product = await prisma.product.create({
      data: {
        title,
        price: parsedPrice,
        category,
        description,
        image,
        sellerId: req.user.id,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error("Error adding product:", err);
    return res.status(500).json({ error: "Failed to add product" });
  }
});

// Deletes a product.
app.delete("/products/:id", requireProductManager, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    const deleted = await prisma.product.delete({ where: { id } });
    return res.json({ message: "Product deleted", product: deleted });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

// Imports JSON products.
app.post("/products/bulk", requireProductManager, async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Expected an array of products" });
    }

    // Normalizes product data before insert.
    const cleanedProducts = products.map((product) => ({
      title: product.title,
      price: parseCsvPrice(product.price),
      category: product.category,
      description: product.description,
      image: product.image,
      sellerId: req.user.id,
    }));

    const created = await prisma.product.createMany({
      data: cleanedProducts,
      skipDuplicates: true,
    });

    return res.status(201).json({
      message: "Bulk upload successful",
      count: created.count,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Imports CSV products.
app.post("/products/upload-csv", requireProductManager, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded" });
  }

  const filePath = req.file.path;
  const products = [];
  const errors = [];
  let dataRowsRead = 0;
  let physicalRowsRead = 0;
  const separator = detectCsvSeparator(filePath);
  let headerValidation = null;

  fs.createReadStream(filePath)
    .pipe(
      csv({
        separator,
        mapHeaders: ({ header }) => normalizeCsvHeader(header),
      })
    )
    .on("headers", (headers) => {
      headerValidation = validateCsvHeaders(headers);
    })
    .on("data", (row) => {
      physicalRowsRead += 1;

      if (isEmptyCsvRow(row)) {
        return;
      }

      dataRowsRead += 1;

      const title = row.title?.trim();
      const price = parseCsvPrice(row.price);
      const category = row.category?.trim();
      const description = row.description?.trim();
      const image = row.image?.trim();

      if (!title || price === null || !category || !description || !image) {
        errors.push({
          rowNumber: physicalRowsRead + 1,
          row,
          error: buildCsvRowError(row),
        });
        return;
      }

      products.push({ title, price, category, description, image, sellerId: req.user.id });
    })
    .on("error", (err) => {
      console.error("CSV upload error:", err);
      fs.rmSync(filePath, { force: true });
      return res.status(500).json({ error: "CSV upload failed" });
    })
    .on("end", async () => {
      try {
        if (headerValidation) {
          fs.rmSync(filePath, { force: true });
          return res.status(400).json(headerValidation);
        }

        const created = await prisma.product.createMany({
          data: products,
          skipDuplicates: true,
        });

        fs.rmSync(filePath, { force: true });

        return res.status(201).json({
          message: "CSV upload complete",
          rowsRead: dataRowsRead,
          headerRowsSkipped: 1,
          inserted: created.count,
          skippedOrInvalid: errors.length,
          errors,
        });
      } catch (err) {
        console.error("Database CSV upload error:", err);
        fs.rmSync(filePath, { force: true });
        return res.status(500).json({ error: "Failed to save CSV data" });
      }
    });
});

// Returns product manager analytics.
app.get("/analytics/products", requireProductManager, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        likes: {
          select: {
            id: true,
          },
        },
        seller: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    return res.json(buildProductAnalytics(products));
  } catch (err) {
    console.error("Analytics error:", err);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Lists liked products for a user.
app.get("/likes/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const likes = await prisma.like.findMany({
      where: { userId },
      orderBy: { id: "asc" },
    });

    return res.json(likes);
  } catch (err) {
    console.error("Fetch likes error:", err);
    return res.status(500).json({ error: "Failed to fetch likes" });
  }
});

// Saves a liked product.
app.post("/likes", async (req, res) => {
  const userId = parseInt(req.body.userId, 10);
  const productId = parseInt(req.body.productId, 10);

  if (Number.isNaN(userId) || Number.isNaN(productId)) {
    return res.status(400).json({ error: "Invalid user or product id" });
  }

  try {
    const like = await prisma.like.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });

    return res.status(201).json(like);
  } catch (err) {
    console.error("Like error:", err);
    return res.status(500).json({ error: "Failed to like product" });
  }
});

// Removes a liked product.
app.delete("/likes", async (req, res) => {
  const userId = parseInt(req.body.userId, 10);
  const productId = parseInt(req.body.productId, 10);

  if (Number.isNaN(userId) || Number.isNaN(productId)) {
    return res.status(400).json({ error: "Invalid user or product id" });
  }

  try {
    await prisma.like.delete({
      where: { userId_productId: { userId, productId } },
    });

    return res.json({ message: "Product unliked" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.json({ message: "Product was not liked" });
    }

    console.error("Unlike error:", err);
    return res.status(500).json({ error: "Failed to unlike product" });
  }
});

// Starts the API server.
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
