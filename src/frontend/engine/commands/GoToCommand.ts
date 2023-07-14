import { tryParseInt } from "../../infra/Helpers";
import { Vec2 } from "../../infra/LinAlg";
import { CommandGenerator, CommandStateCompleted, CommandStateError, CommandStateFailed, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import CSprite from "../comps/CSprite";
import { GameAgentContext } from "../systems/AgentCommandSystem";

export default class GoToCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "go_to_position";
  public readonly shortSummary: string = "Go to target position";
  public readonly longSummary: string = "Try moving to the target x and y coordinate";
  public readonly defineArgs: Record<string, string> = {
    x: "grid_x_int",
    y: "grid_y_int",
    // hiddenArg goToNeighbour: boolean
  };

  // todo auto validate args

  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    const locationService = context.gc.locationService;
    const agentId = context.eid;
    const ecs = context.ecs;

    // validate arguments
    if (!("x" in commandArgs)) {
      return new CommandStateError(["x argument must be provided"]);
    }
    commandArgs.x = tryParseInt(commandArgs.x);
    if (commandArgs.x === undefined) {
      return new CommandStateError(["x argument must be an integer"]);
    }
    if (!("y" in commandArgs)) {
      return new CommandStateError(["y argument must be provided"]);
    }
    commandArgs.y = tryParseInt(commandArgs.y);
    if (commandArgs.y === undefined) {
      return new CommandStateError(["y argument must be an integer"]);
    }

    // hidden arg
    const goToNeighbour = !!commandArgs.goToNeighbour;

    console.log("update target position?");
    context.agent.resetAgentMovement();

    if (goToNeighbour) {
      locationService.setAgentPathingToNeighbour(ecs, agentId, new Vec2(commandArgs.x, commandArgs.y));
    } else {
      locationService.setAgentPathing(ecs, agentId, new Vec2(commandArgs.x, commandArgs.y));
    }

    const sprite = context.ecs.getComponent(context.eid, CSprite);

    let currentPos = sprite.gridPos;
    let currentPosCount = 0;

    // count how long agent has been at position to detect when they are stuck
    while (context.agent.targetGridPos !== null) {
      const pos = sprite.gridPos;
      if (currentPos.equals(pos)) {
        currentPosCount += 1;
      } else {
        currentPos = pos;
        currentPosCount = 0;
      }
      if (currentPosCount > 40) {
        return new CommandStateFailed(`You were unable to reach your destination, something is blocking your path`);
      }
      yield;
    }

    return new CommandStateCompleted(`You have reached your destination`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return false;
  }
}
