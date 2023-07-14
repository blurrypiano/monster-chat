import { CommandResponseApiModel, CommandResult, IGptAgent } from "./GptAgentManager";


export interface IAiCommandService {
  getNextCommand: (
    prompt: string, 
    agent: IGptAgent,
    userInput: string,
  ) => Promise<CommandResponseApiModel>;
}
