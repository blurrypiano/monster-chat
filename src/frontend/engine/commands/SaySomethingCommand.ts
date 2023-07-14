import { tryParseEntId, tryParseString } from "../../infra/Helpers";
import { CommandGenerator, CommandStateError, CommandStateFailed, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import { GameAgentContext } from "../systems/AgentCommandSystem";
import FollowCommand from "./FollowCommand";


export default class SaySomethingCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "say_something";
  public readonly shortSummary: string = "Say something to target character";
  public readonly longSummary: string = "Say something to target character";
  public readonly defineArgs: Record<string, any> = {
    characterId: "character_id_int",
    message: "message",
  };

  // todo auto validate args

  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    const agentId = context.eid;
    const locationService = context.gc.locationService;
    const conversationService = context.gc.conversationService;
    const ecs = context.ecs;

    // validate arguments
    if (!("characterId" in commandArgs)) {
      return new CommandStateError(["characterId argument must be provided"]);
    }
    const characterId = tryParseEntId(commandArgs.characterId);
    if (characterId === undefined) {
      return new CommandStateError(["characterId argument must be a valid characterId"]);
    }

    if (!("message" in commandArgs)) {
      return new CommandStateError(["message argument must be provided"]);
    }
    const message = tryParseString(commandArgs.message);
    if (!message) {
      return new CommandStateError(["message argument must be a valid string"]);
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

    conversationService.saySomething(ecs, agentId, characterId, message);

    const timeout = Date.now() + (1000 * 90); // wait up to 90 seconds for a response
    while (Date.now() < timeout) yield;

    return new CommandStateFailed(`Character ${characterId} has not responded`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return true;
  }

}

