import LocationService, { manhattanDistance } from "./LocationService";
import EcsManager, { EntIdType } from "../../infra/Ecs";
import { Vec2 } from "../../infra/LinAlg";
import CAgent from "../comps/CAgent";
import CGridCollider from "../comps/CGridCollider";
import CSprite from "../comps/CSprite";

export default class MovementService {

  // movement service should be responsible for keeping track of next positions, not the CGridCollider
  // should also probably consolidate this into the location service
  constructor(
    private readonly _locationService: LocationService,
  ) {

  }

  public isInMotion(ecs: EcsManager, entId: EntIdType): boolean {
    const gridCollider = ecs.getComponent(entId, CGridCollider);
    return gridCollider && !!gridCollider.nextGridPos;
  }

  public locationOnCurrentPath(ecs: EcsManager, entId: EntIdType, loc: Vec2 | undefined): boolean {
    if (!loc) return false;
    const agent = ecs.getComponent(entId, CAgent);
    if (!agent) return false;
    if (!agent.movementPath) return false;
    return agent.movementPath.findIndex((v) => v.equals(loc)) >= agent.movementPathIndex;
  }

}