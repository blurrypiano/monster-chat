import { locationContext } from "../../../data/locationData";
import { CommandGenerator, CommandStateCompleted, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import { GameAgentContext } from "../systems/AgentCommandSystem";

export default class CheckMapCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "check_map";
  public readonly shortSummary: string = "Check map for valid locations";
  public readonly longSummary: string = "Check map and get location ids and descriptions of places you can explore";
  public readonly defineArgs: Record<string, string> = {};

  // eslint-disable-next-line require-yield
  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    const locations = Array.from(Object.entries(locationContext)).map(([k, v]) => v);
    const locText = JSON.stringify(locations);
    return new CommandStateCompleted(`The map shows the following locations: ${locText}`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // todo maybe just get rid of this?
    return true;
  }

}
