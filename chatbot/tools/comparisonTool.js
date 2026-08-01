import ProductModel from "../../models/Product.js";

export const comparisonTool = {
    name: "product_comparison",
    description: "Compare two specific products by ID.",
    requiresAuth: false,

    async execute(args, context){
        const { productIds } = args;

        if(!productIds || productIds.length !== 2){
            return { found: false, message: "Need exactly two products to compare." };
        }

        const docs = await ProductModel.find({_id: {$in: productIds}})
        .populate("category");

        if(docs.length !== 2){
            return {found: false, message: "Couldn't find both products."}
        }

        const ordered = productIds.map((id) => docs.find((d) => d._id.toString() === id));

        return {
            found: true,
            products: ordered.map((p) => ({
                id: p._id.toString(),
                name: p.name,
                description: p.description,
                price: p.price,
                category: p.category?.name ?? null,
                stock: p.stock,
                inStock: p.stock > 0,
                rating: p.ratings.average,
                totalReviews: p.ratings.totalReviews,
                image: p.images?.[0]?.url ?? null,
                link: `/products/${p._id}`,
            }))
        }
    }
}