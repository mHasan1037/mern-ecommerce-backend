import openai from "../utils/openaiConfig.js";


export const chatWithAI = async (req, res) =>{
   try{
      const { message } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        message: [{role: "user", content: message}]
      })

      res.status(200).json({
        replay: response.choices[0].message.content
      })
   }catch(err){
      res.status(500).json({
        message: "AI error",
        error: err.message
      })
   }
}