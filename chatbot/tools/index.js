import { comparisonTool } from "./comparisonTool.js";
import { orderTool } from "./order.tool.js";
import { productTool } from "./product.tool.js";


export const tools = {
    product_query : productTool,
    order_status : orderTool,
    product_comparison: comparisonTool
}

export const runTool = async(intent, args, context) =>{
   const tool = tools[intent]; 

   if (!tool) {
    return { error: "unknown_intent" };
  }

  if (tool.requiresAuth && !context.isAuthenticated) {
    return {
      error: "auth_required",
      authForm: "login",      
      retryIntent: intent,   
      retryArgs: args,
    };
  }

  return tool.execute(args, context);
}