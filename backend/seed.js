const { PrismaClient } = require("@prisma/client");

// Creates a Prisma database client.
const prisma = new PrismaClient();

// Seeds starter products.
async function main() {
  // Inserts sample products without duplicating existing rows.
  await prisma.product.createMany({
    data: [
      {
        title: "Mens Casual Slim Fit",
        price: 25.99,
        category: "men's clothing",
        description: "A classic slim fit T-shirt.",
        image: "https://m.media-amazon.com/images/I/51bsX9geU4L._AC_UL320_.jpg",
      },
      {
        title: "Solid Gold Petite Micropave",
        price: 168.0,
        category: "jewelery",
        description: "18K Gold plated ring with diamonds.",
        image: "https://m.media-amazon.com/images/I/61p-oxRWQIL._AC_SY695_.jpg",
      },
      {
        title: "ZOTAC Gaming RTX 4070",
        price: 599.99,
        category: "electronics",
        description: "High-end graphics card.",
        image: "https://m.media-amazon.com/images/I/81g7Hx94HaL._AC_SX425_.jpg",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded products!");
}

// Runs the seed script and closes the database connection.
main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
