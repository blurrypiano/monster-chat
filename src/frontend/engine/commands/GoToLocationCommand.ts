import { tryParseInt } from "../../infra/Helpers";
import { CommandGenerator, CommandStateCompleted, CommandStateError, IGptCommand, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import { GameAgentContext } from "../systems/AgentCommandSystem";
import GoToCommand from "./GoToCommand";

export default class GoToLocationCommand implements IGptCommand<GameAgentContext>  {
  public readonly commandName: string = "go_to_location";
  public readonly shortSummary: string = "Go to location";
  public readonly longSummary: string = "Move to the target location";
  public readonly defineArgs: Record<string, any> = {
    locationId: "location_id_int",
  };

  // todo auto validate args

  public *commandGenerator(context: GameAgentContext, commandArgs: Record<string, any>): CommandGenerator {
    // validate arguments
    if (!("locationId" in commandArgs)) {
      return new CommandStateError(["location argument must be provided"]);
    }

    commandArgs.locationId = tryParseInt(commandArgs.locationId);
    console.log(`Location ${commandArgs.locationId}`);
    if (commandArgs.locationId === undefined) {
      return new CommandStateError(["location argument must be a valid locationId"]);
    }

    const locationService = context.gc.locationService;
    const randomTile = locationService.getRandomTileAtLocation(commandArgs.locationId);
    if (!randomTile) {
      // const validLocations = Object.entries(locationData).map(([k, v]) => k).join(", ");
      return new CommandStateError([`Invalid location id. use "check_map" command to lookup valid locations`]);
    }

    // const loc = locationData[commandArgs.location];
    context.agent.targetGridPos = randomTile;
    // const collider = context.ecs.getComponent(context.eid, CGridCollider);

    const goToCommand = new GoToCommand();
    const generator = goToCommand.commandGenerator(context, { x: randomTile.x, y: randomTile.y });
    let goToResult = generator.next();
    while (!goToResult.done) {
      yield;
      goToResult = generator.next();
    }

    // return go to result if it fails
    if (goToResult.value.status !== "completed") {
      return goToResult.value;
    }

    return new CommandStateCompleted(`You have reached ${commandArgs.locationId}`);
  }

  public isAvailable(context: GameAgentContext, worldState: WorldState): boolean {
    // state rather than transition based?
    return true;
  }

}
