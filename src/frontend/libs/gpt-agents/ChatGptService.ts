import axios from "axios";
import { CHATGPT_API_KEY } from "../../../.apikeys";
import { CommandResponseApiModel, CommandResult, IGptAgent } from "./GptAgentManager";
import { IAiCommandService } from "./IAiCommandService";
import { NlpUtil } from '@nlpjs/core';
import { GptMessage, createGptMessage } from "./GptMessage";

const apiKey = CHATGPT_API_KEY;
const CHATGPT_API_PATH = "https://api.openai.com/v1/chat/completions";

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`
};

export default class ChatGptService implements IAiCommandService {

  public static readonly TOKEN_LIMIT = 4000;
  public static readonly API_LIMIT = 100;

  private _requestCount = 0;

  public async getNextCommand(prompt: string, agent: IGptAgent, userInput: string): Promise<CommandResponseApiModel> {
    const initialMessages: GptMessage[] = [
      createGptMessage('user', prompt),
    ];

    // reserve 1000 tokens for response
    let tokensRemaining = ChatGptService.TOKEN_LIMIT - 1000;
    tokensRemaining -= ChatGptService.countTokens(initialMessages);

    // todo get relevant memories

    const userMessage = createGptMessage("user", userInput);
    tokensRemaining -= ChatGptService.countTokens([userMessage]);
    const [messageHistoryIndex, historyTokenCount] = this.getIndexAndTokenCountWithinLimit(agent.fullMessageHistory, tokensRemaining);
    tokensRemaining -= historyTokenCount;

    const messages = [
      ...initialMessages,
      ...agent.fullMessageHistory.slice(messageHistoryIndex),
      userMessage,
    ];

    console.log(messages.map(x => x.content).join("\n\n"));
    console.log(`remaining token estimate: ${tokensRemaining}`);
    if (tokensRemaining < 0) throw new Error("Out of tokens!!!");
    // Intentionally not awaiting this call. We want to continue execution while the
    // api request is made in the background
    return this.postChatGpt(messages);
  }

  public async postChatGpt(messages: GptMessage[]): Promise<CommandResponseApiModel> {
    this._requestCount += 1;
    if (this._requestCount > ChatGptService.API_LIMIT) {
      throw new Error("ChatGpt Request limit exceeded!!!");
    }

    console.log("***** CHATGPT API CALL *****");
    const payload = {
      model: "gpt-3.5-turbo",
      messages
    };

    try {
      const response = await axios.post(CHATGPT_API_PATH, payload, { headers });
      console.log(response);
      const textResponse = response.data.choices[0].message.content as string;
      console.log(textResponse);
      try {
        // Parse the response string into a JavaScript object
        const responseObject = JSON.parse(textResponse);
        return responseObject as CommandResponseApiModel;
      } catch (error) {
        // Handle any errors that may occur during parsing or type casting
        console.error('Error parsing response:', error);
        throw new Error(`Invalid command format, please return responses in the format specified`);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private getIndexAndTokenCountWithinLimit(messages: GptMessage[], tokenLimit: number): [number, number] {
    let tokenCount = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      const tokensToAdd = ChatGptService.countTokens([messages[i]]);
      // message doesn't fit so return i+1 and the current token count
      if (tokenCount + tokensToAdd > tokenLimit) {
        return [i + 1, tokenCount];
      }
      // otherwise message must fit so increment tokenCount
      tokenCount += tokensToAdd;
    }

    return [0, tokenCount];
  }

  public static countTokens(messages: GptMessage[], model = 'gpt-3.5-turbo-0301'): number {
    // const tokenizer = NlpUtil.getTokenizer(model);
    // if (!tokenizer) {
    //   throw new Error(`countTokens() is not presently implemented for model ${model}.`);
    // }
    // for now just estimate about 4 characters per token
    let numTokens = 0;
    for (const message of messages) {
      numTokens += 4;
      for (const [key, value] of Object.entries(message)) {
        numTokens += Math.ceil(value.length / 5);
        if (key === 'name') {
          numTokens--;
        }
      }
    }
    numTokens += 2;
    return numTokens;
  }
}
