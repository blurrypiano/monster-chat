import internal from "stream";
import locationData from "../../../data/locationData";
import { tryParseEntId, tryParseInt } from "../../infra/Helpers";
import { CommandGenerator, CommandStateCompleted, CommandStateError, CommandStateFailed, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import CGridCollider from "../comps/CGridCollider";
import CSprite from "../comps/CSprite";
import { GameAgentContext } from "../systems/AgentCommandSystem";
import GoToCommand from "./GoToCommand";

export default class FollowCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "follow";
  public readonly shortSummary: string = "Follow the target character";
  public readonly longSummary: string = "Follow the target character";
  public readonly defineArgs: Record<string, any> = {
    characterId: "character_id_int",
  };

  constructor(private readonly _timeout: number = 30) {}

  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    const agentId = context.eid;
    const locationService = context.gc.locationService;

    // validate arguments
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

    while (true) {
      const loc = locationService.getLocationById(characterId);
      if (!loc) {
        return new CommandStateFailed("The target character cannot be reached");
      }
      const goToCommand = new GoToCommand();
      const generator = goToCommand.commandGenerator(context, { x: loc.x, y: loc.y, goToNeighbour: true });
      yield;
      let goToResult = generator.next();
      while (!goToResult.done) {
        const distance = locationService.manhattanDistanceBetweenEnts(agentId, characterId);
        if (distance < 0) {
          // this can happen for example if you are following the character and they die
          return new CommandStateFailed("The target character cannot be reached");
        } else if (distance === 1) {
          const waitUntilTime = Date.now() + this._timeout * 1000;
           while (Date.now() < waitUntilTime) {
            if (locationService.manhattanDistanceBetweenEnts(agentId, characterId) > 2) break;
            yield;
           };
           if (locationService.manhattanDistanceBetweenEnts(agentId, characterId) > 2) break;
          context.agent.resetAgentMovement();
          return new CommandStateCompleted(`You have reached ${characterId}`);
        }
        yield;
        goToResult = generator.next();
      }
    }
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return true;
  }

}
