
import { classifyIntent } from "../classifier.js";
import { runTool } from "../tools/index.js";


export const classifyIntentNode = async (state) => {
  const { intent, entities } = await classifyIntent(state.message);
  return { intent, entities };
};

export const runToolNode = async (state) => {
  if (state.intent === "general_chat" || state.intent === "policy_query")
    return;

  const result = await runTool(state.intent, state.entities, {
    isAuthenticated: state.isAuthenticated,
    userId: state.userId,
  });

  return { entities: { ...state.entities, toolResult: result } };
};

export const formatResponseNode = async (state) => {
  const result = state.entities?.toolResult;

  switch (state.intent) {
    case "product_query": {
      if (!result?.found) {
        return {
          response: { message: "I couldn't find any matching products." },
        };
      }
      const top = result.products[0];

      return {
        response: {
          message: `Found ${result.total} result(s). Top match: ${top.name} — ৳${top.price}.`,
          link: top.link,
        },
      };
    }

    case "order_status": {
      if (result?.error === "auth_required") {
         return {
            response: {
              message: "Please log in to check your order status.",
              action: {
                type: "open_auth_form",
                form: result.authForm,       // "login"
                retryIntent: result.retryIntent,
                retryArgs: result.retryArgs,
              },
            },
          };
      }
      if (!result.found) {
        return { response: { message: result.message, link: result.link } };
      }
      return {
        response: {
          message: `You have ${result.total} orders. Latest: ${result.latestOrder.status}.`,
          link: result.link,
        },
      };
    }
    
    case "policy_query": {
      // static content lookup — not a "tool" in the DB sense, just a map/file
      return { response: { message: getPolicyAnswer(state.entities) } };
    }

    default: {
      return {
        response: { message: "Hi there, How can I help you?" },
      };
    }
  }
};

function getPolicyAnswer(entities) {
  // placeholder — plug in your FAQ/policy lookup
  return "You can find our return policy on the Policies page.";
}
