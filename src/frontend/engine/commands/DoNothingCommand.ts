import { tryParseInt } from "../../infra/Helpers";
import { CommandGenerator, CommandStateCompleted, CommandStateError, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import { GameAgentContext } from "../systems/AgentCommandSystem";

export default class DoNothingCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "do_nothing";
  public readonly shortSummary: string = "Do nothing";
  public readonly longSummary: string = "Stay where you are and wait for an interrupt or the desired amount of time has passed";
  public readonly defineArgs: Record<string, string> = {
    duration: "time_in_seconds",
  };

  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    // validate arguments
    if (!("duration" in commandArgs)) {
      return new CommandStateError(["duration argument must be provided"]);
    }
  
    commandArgs.duration = tryParseInt(commandArgs.duration);
    if (commandArgs.duration === undefined) {
      return new CommandStateError(["duration argument must be an integer"]);
    }
    
    const waitUntilTime = Date.now() + commandArgs.duration * 1000;
    console.log(`do_nothing for ${commandArgs.duration}`);

    while (Date.now() < waitUntilTime) yield;
    return new CommandStateCompleted("You have finished waiting");
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    return false;
  }

}
