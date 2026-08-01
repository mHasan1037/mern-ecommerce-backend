import { generateComparisonText } from "../../utils/comparisonFormatter.js";
import { classifyIntent } from "../classifier.js";
import { runTool } from "../tools/index.js";

export const classifyIntentNode = async (state) => {
  if (state.intent) return {};
  const { intent, entities } = await classifyIntent(state.message);
  return { intent, entities };
};

export const runToolNode = async (state) => {
  if (state.intent === "general_chat" || state.intent === "policy_query"){
    return {}
  }

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
      return {
        response: {
          message: `Found ${result.total} result(s):`,
          card: {
            type: "product_list",
            products: result.products.map((p) => ({
              name: p.name,
              price: p.price,
              image: p.image,
              link: p.link,
            })),
          },
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
              form: result.authForm, // "login"
              retryIntent: result.retryIntent,
              retryArgs: result.retryArgs,
            },
          },
        };
      }
      if (!result.found) {
        return { response: { message: result.message, link: result.link } };
      }

      const order = result.latestOrder;

      return {
        response: {
          message: `You have ${result.total} orders. Here's your latest one:`,
          card: {
            type: "order",
            status: order.status,
            total: order.total,
            placedAt: order.placedAt,
            items: order.items,
          },
          link: result.link,
        },
      };
    }

    case "product_comparison":
      {
        if (!result?.found) {
          return {
            response: {
              message: result?.message ?? "Couldn't compare those products.",
            },
          };
        }
      }

      const naturalComparison = await generateComparisonText(result.products);

      return {
        response: {
          message: naturalComparison,
          card: {
            type: "comparison",
            products: result.products,
          },
        },
      };

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
