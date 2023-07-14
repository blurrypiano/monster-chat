import LocationService from "../services/LocationService";
import EcsManager, { EntsWith } from "../../infra/Ecs";
import CGridCollider from "../comps/CGridCollider";
import CSprite from "../comps/CSprite";
import GameContext from "../GameContext";

type CompOrder = [CSprite, CGridCollider];
const constructors = [CSprite, CGridCollider];

export default class SpriteLocationSystem {

  constructor(private readonly _locationService: LocationService) { }

  public run(gc: GameContext, ecs: EcsManager): void {
    // gc.spriteLookup.clear();
    this._locationService.clear();
    const ents: EntsWith<CompOrder> = ecs.getEntsWith(...constructors);

    // put any sprites into the lookup map
    for (const [eid, [sprite, collider]] of ents) {
      // if (!collider.gridPos) continue;
      // var hash = collider.gridPos.toString();
      // if (gc.spriteLookup.has(hash)) {
      //   var entIdList = gc.spriteLookup.get(hash)!;
      //   entIdList.push(eid);
      // } else {
      //   gc.spriteLookup.set(hash, [eid]);
      // }

      this._locationService.upsert(eid, sprite.gridPos);
      if (collider.nextGridPos) {
        this._locationService.upsert(eid, collider.nextGridPos);
      }
    }

  }
}