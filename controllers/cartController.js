import ProductModel from "../models/Product.js";
import UserModel from "../models/User.js";

export const addToCart = async (req, res)=>{
    try{
       const userId = req.user._id;
       const { productId, quantity } = req.body;

       const product = await ProductModel.findById(productId);
       if(!product){
        return res.status(404).json({
            message: "Product not found"
        })
       };

       const user = await UserModel.findById(userId);

       const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

       if(itemIndex > -1){
        user.cart[itemIndex].quantity += quantity;
       }else{
        user.cart.push({product: productId, quantity});
       }

       await user.save();

       return res.status(200).json({
        message: "Item added to cart",
        cart: user.cart
       });
    }catch(err){
        console.error("❌ Error adding to cart:", err);
       res.status(500).json({
        message: "Failed to add to cart",
        error: err.message
       })
    }
}

export const getCart = async (req, res) =>{
    try{
       const userId = req.user._id;

       const user= await UserModel.findById(userId)
          .populate("cart.product", "name price images")
          .select("cart");

       if(!user){
        return res.status(404).json({
            message: "User not found"
        })
       };

       return res.status(200).json({
        message: "Cart fetched successfully",
        cart: user.cart,
       });
    }catch(err){
        return res.status(500).json({
            message: "Failed to fetch cart",
            error: err.message
        })
    }
}

export const updateCartItem = async (req, res) =>{
    try{
       const userId = req.user._id;
       const { productId } = req.params;
       const { quantity } = req.body;

       if(!quantity || quantity < 1){
        return res.status(400).json({
            message: "Quantity must be at least 1"
        })
       }

        const user = await UserModel.findById(userId).select('cart');
        if(!user) return res.status(404).json({message: "User not found"});


       const itemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId
       );

       if(itemIndex === -1){
        return res.status(404).json({
            message: "product not found in cart"
        })
       }

       user.cart[itemIndex].quantity = quantity;

       await user.save();

      const updatedUser = await UserModel.findById(userId)
        .populate("cart.product", "name price images")
        .select("cart");

       return res.status(200).json({
        message: "Cart item quantity updated",
        cart: updatedUser.cart
       })
    }catch(err){
       res.status(500).json({
        message: "Failed to update cart item",
        error: err.message
       })
    }
}

export const deleteCartItem = async (req, res) =>{
   try{
      const userId = req.user._id;
      const { productId } = req.params;

      const user = await UserModel.findById(userId);

      const itemIndex = user.cart.findIndex(
        item => item.product.toString() === productId
      );

      if(itemIndex === -1){
        return res.status(404).json({
            message: "Product not found in cart"
        })
      }

      user.cart.splice(itemIndex, 1);

      await user.save();

      return res.status(200).json({
        message: "Item removed from cart",
        cart: user.cart
      })
   }catch(err){
      return res.status(500).json({
        message: "Failed to remove item from cart",
        error: err.message
      })
   }
}

export const clearCart = async (req, res) =>{
    try{
       const userId = req.user._id;

       const user = await UserModel.findById(userId);

       if(!user){
        return res.status(404).json({
            message: "User not found"
        })
       };

       user.cart = []

       await user.save();

       return res.status(200).json({
        message: "Cart cleared successfully",
        cart: []
       })
    }catch(err){
        return res.status(500).json({
            message: "Failed to remove item from cart",
            error: err.message
        })
    }
}