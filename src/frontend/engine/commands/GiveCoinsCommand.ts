import { tryParseEntId, tryParseInt, tryParseString } from "../../infra/Helpers";
import { CommandGenerator, CommandStateCompleted, CommandStateError, CommandStateFailed, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import CGridCollider from "../comps/CGridCollider";
import { CInventory, CItem } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import { GameAgentContext } from "../systems/AgentCommandSystem";
import FollowCommand from "./FollowCommand";
import GoToCommand from "./GoToCommand";

export default class GiveCoinsCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "give_coins";
  public readonly shortSummary: string = "Give coins to characterId";
  public readonly longSummary: string = "Give coins to characterId";
  public readonly defineArgs: Record<string, string> = {
    characterId: "character_id",
    amount: "amount_int",
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
    if (!("amount" in commandArgs)) {
      return new CommandStateError(["amount argument must be provided"]);
    }
    const amount = tryParseInt(commandArgs.amount);
    if (amount === undefined) {
      return new CommandStateError(["amount argument must be valid integer"]);
    }
    if (!("characterId" in commandArgs)) {
      return new CommandStateError(["charcterId argument must be provided"]);
    }
    const characterId = tryParseEntId(commandArgs.characterId);
    if (characterId === undefined) {
      return new CommandStateError(["charcterId argument must be a valid characterId from nearby people list"]);
    }
    if (characterId === agentId) {
      return new CommandStateError(["charcterId argument cannot be your own characterId"]);
    }
    
    if (!inventoryService.hasCoins(ecs, agentId, amount)) {
      return new CommandStateError([`you do not have ${amount} coins currently in your inventory`]);
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
   
    inventoryService.giveCoins(ecs, amount, agentId, characterId);
    return new CommandStateCompleted(`You gave the character ${characterId} ${amount} coins`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return true;
  }
}
