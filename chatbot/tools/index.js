import { orderTool } from "./order.tool.js";
import { productTool } from "./product.tool.js";


export const tools = {
    product_query : productTool,
    order_status : orderTool
}

export const runTool = async(intent, args, context) =>{
   const tool = tools[intent]; 

   if (!tool) {
    return { error: "unknown_intent" };
  }

  if (tool.requiresAuth && !context.isAuthenticated) {
    return {
      error: "auth_required",
      authForm: "login",       // matches your AuthFormType
      retryIntent: intent,     // so you can auto-retry after login (optional but nice)
      retryArgs: args,
    };
  }

  return tool.execute(args, context);
}