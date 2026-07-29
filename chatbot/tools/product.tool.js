import { findProducts } from "../../services/product.service.js";


export const productTool = {
  name: "product_query",
  description: "Search the product catalog by name, category, or price range.",
  requiresAuth: false,

  async execute(args, context) {
    const { search, category, minPrice, maxPrice, sort, limit = 5 } = args;

    const { products, total } = await findProducts({
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      limit,
    });

    if (!products.length) {
      return { found: false, message: "No products matched that search." };
    }

    return {
      found: true,
      total,
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        category: p.category?.name ?? null,
        inStock: p.stock > 0,
        link: `/products/${p._id}`,
      })),
    };
  },
};
