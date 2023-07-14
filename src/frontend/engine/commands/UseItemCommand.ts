import { tryParseEntId } from "../../infra/Helpers";
import { CommandGenerator, CommandStateCompleted, CommandStateError, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import { GameAgentContext } from "../systems/AgentCommandSystem";

export default class UseItemCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "use_item";
  public readonly shortSummary: string = "Use item in inventory";
  public readonly longSummary: string = "Use an item in your inventory";
  public readonly defineArgs: Record<string, string> = {
    itemId: "item_id",
  };

  // eslint-disable-next-line require-yield
  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    const agentId = context.eid;
    const inventoryService = context.gc.inventoryService;
    const ecs = context.ecs;

    // validate arguments
    if (!("itemId" in commandArgs)) {
      return new CommandStateError(["itemId argument must be provided"]);
    }
  
    const itemId = tryParseEntId(commandArgs.itemId);
    if (itemId === undefined) {
      return new CommandStateError(["itemId argument invalid type"]);
    }

    if (!inventoryService.hasItem(ecs, agentId, itemId)) {
      return new CommandStateError([`itemId must be a valid itemId currently in your inventory`]);
    }

    inventoryService.useItem(ecs, agentId, itemId);
    return new CommandStateCompleted(`You used the item: ${itemId}`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return true;
  }
}
