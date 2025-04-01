import UserModel from "../models/User.js"

export const addToWishlist = async (req, res) =>{
    try{
       const user = await UserModel.findById(req.user._id);
       const productId = req.params.productId;

       if(!user.wishlist.includes(productId)){
        user.wishlist.push(productId);
        await user.save();
       }

       res.status(200).json({
        message: "Added to wishlist",
        wishlist: user.wishlist
       })
    }catch(err){
       res.status(500).json({
        message: "Error adding to wishlist",
        error: err.message
       })
    }
}

export const getWishlist = async (req, res) =>{
    try{
       const user = await UserModel.findById(req.user._id)
           .populate("wishlist", "name price images")
       
       res.status(200).json({
        message: "Wishlist fetched successfully",
        wishlist: user.wishlist
       });
    }catch(err){
       res.status(500).json({
        message: "Error fetching wishlist",
        error: err.message
       })
    }
}

export const removeFromWishlist = async (req, res) =>{
    try{
       const user = await UserModel.findById(req.user._id);
       const productId = req.params.productId;

       user.wishlist = user.wishlist.filter(
        pid => pid.toString() !== productId.toString()
       )

       await user.save();

       res.status(200).json({
        message: "Removed from wishlist",
        wishList: user.wishlist
       })
    }catch(err){
       res.status(500).json({
        message: "Error removing from wishlist",
        error: err.message
       })
    }
}