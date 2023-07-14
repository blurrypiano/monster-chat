import { tryParseEntId, tryParseInt, tryParseString } from "../../infra/Helpers";
import { CommandGenerator, CommandStateCompleted, CommandStateError, CommandStateFailed, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import CGridCollider from "../comps/CGridCollider";
import { CInventory, CItem } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import { GameAgentContext } from "../systems/AgentCommandSystem";
import FollowCommand from "./FollowCommand";
import GoToCommand from "./GoToCommand";

export default class GiveItemCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "give_item";
  public readonly shortSummary: string = "Give item";
  public readonly longSummary: string = "Give item to target character";
  public readonly defineArgs: Record<string, string> = {
    characterId: "character_id",
    itemId: "item_id",
  };

  // todo auto validate args?

  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    const agent = context.agent;
    const agentId = context.eid;

    const inventoryService = context.gc.inventoryService;
    const conversationService = context.gc.inventoryService;
    const locationService = context.gc.locationService;
    const ecs = context.ecs;

    // validate arguments
    if (!("itemId" in commandArgs)) {
      return new CommandStateError(["itemId argument must be provided"]);
    }
    const itemId = tryParseEntId(commandArgs.itemId);
    if (itemId === undefined) {
      return new CommandStateError(["itemId argument invalid type"]);
    }
    if (!("characterId" in commandArgs)) {
      return new CommandStateError(["charcterId argument must be provided"]);
    }
    const characterId = tryParseEntId(commandArgs.characterId);
    if (characterId === undefined) {
      return new CommandStateError(["charcterId argument must be a valid characterId from nearby people list"]);
    }
    
    if (!inventoryService.hasItem(ecs, agentId, itemId)) {
      return new CommandStateError([`itemId must be a valid itemId currently in your inventory`]);
    }

    // 1. go to character
    const targetLoc = locationService.getLocationById(characterId);
    if (!targetLoc) {
      return new CommandStateError([`Unable to find character: ${characterId}`]);
    }

    const followCommand = new FollowCommand(0);
    const generator = followCommand.commandGenerator(context, { characterId });
    let goToResult = generator.next();
    while (!goToResult.done) {
      yield;
      goToResult = generator.next();
    }

    // return go to result if it fails
    if (goToResult.value.status !== "completed") {
      return goToResult.value;
    }

    // check if agent has room for item
    if (inventoryService.isInventoryFull(ecs, characterId)) {
      return new CommandStateFailed(`The character ${characterId} cannot accept the item, their inventory is full`);
    }

    inventoryService.giveItem(ecs, itemId, agentId, characterId);

    const targetItem = ecs.getComponent(itemId, CItem);
    return new CommandStateCompleted(`You gave the character ${characterId}: ${targetItem.def.description}`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return true;
  }
}
