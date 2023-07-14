import { tryParseEntId } from "../../infra/Helpers";
import { CommandGenerator, CommandStateCompleted, CommandStateError, CommandStateFailed, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import CGridCollider from "../comps/CGridCollider";
import { CInventory } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import { GameAgentContext } from "../systems/AgentCommandSystem";
import GoToCommand from "./GoToCommand";

export default class PickUpItemCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "pick_up_item";
  public readonly shortSummary: string = "Pick up item";
  public readonly longSummary: string = "Move to the item and pick it up";
  public readonly defineArgs: Record<string, string> = {
    itemId: "item_id",
  };

  // todo auto validate args?

  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    const agent = context.agent;
    const inventoryService = context.gc.inventoryService;
    const ecs = context.ecs;

    // validate arguments
    if (!("itemId" in commandArgs)) {
      return new CommandStateError(["itemId argument must be provided"]);
    }
  
    commandArgs.itemId = tryParseEntId(commandArgs.itemId);
    if (commandArgs.itemId === undefined) {
      return new CommandStateError(["itemId argument invalid type"]);
    }

    let currentWorldState = context.getWorldState();
    const targetItem = currentWorldState.nearbyItems.find((v, i) => v.itemId === commandArgs.itemId);
    if (!targetItem) {
      return new CommandStateError([`itemId must be a valid itemId from nearbyItems in worldstate`]);
    }

    const itemPos = context.gc.locationService.getLocationById(targetItem.itemId);
    if (!itemPos) {
      return new CommandStateFailed(`unable to pick up item, someone else must have picked it up first`);
    }

    const goToCommand = new GoToCommand();
    const generator = goToCommand.commandGenerator(context, {x: itemPos.x, y: itemPos.y, goToNeighbour: true});
    let goToResult = generator.next();
    while (!goToResult.done) {
      yield;
      goToResult = generator.next();
    }

    // if agent is 1 spot away from movement path than they are next to their target
    const isNextToItem = inventoryService.isNextToItem(ecs, context.eid, targetItem.itemId);
    // return go to result if error, or failed and not next to target item
    const status = goToResult.value.status;
    if (status === 'error' || (status === 'failed' && !isNextToItem)) {
      return goToResult.value;
    }

    if (!isNextToItem) {
      return new CommandStateFailed(`unable to pick up item, someone else must have picked it up first`);
    }

    // check if agent has room for item
    if (inventoryService.isInventoryFull(context.ecs, context.eid)) {
      return new CommandStateFailed(`unable to pick up item, your can only carry 5 items at once`);
    }

    // pick up item
    inventoryService.pickupItem(ecs, context.eid, targetItem.itemId);
    return new CommandStateCompleted(`You picked up: ${targetItem.description}`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return true;
  }
}
