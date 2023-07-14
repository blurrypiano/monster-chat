import { locationContext } from "../../../data/locationData";
import EcsManager, { EntsWith } from "../../infra/Ecs";
import CClickable from "../comps/CClickable";
import CGridCollider from "../comps/CGridCollider";
import { CItem, itemDefinitons } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import CTransform from "../comps/CTransform";
import GameContext from "../GameContext";

type CompOrder = [CSprite, CClickable, CGridCollider, CTransform, CItem];
const constructors = [CSprite, CClickable, CGridCollider, CTransform, CItem];

export default class AppleSystem {

  // public decreaseRate: number = 100.0 / (60.0 * 60.0 * 10);

  public run(gc: GameContext, ecs: EcsManager): void {
    const ents: EntsWith<CompOrder> = ecs.getEntsWith(...constructors);
    let currentGroundAppleCount = Array.from(ents).length;
    
    while (currentGroundAppleCount++ < 11) {
      this.makeApple(gc, ecs);
      console.log('make apple');
    }
  }

  private makeApple(gc: GameContext, ecs: EcsManager) {

    const locationService = gc.locationService;
    const locationIds = Object.entries(locationContext).map(([k, v]) => v.locationId);
    const index = Math.floor(Math.random() * locationIds.length);
    const randomTile = locationService.getRandomTileAtLocation(locationIds[index]);
    const itemDef = itemDefinitons.find(x => x.name === 'Apple')!;
    const eid = ecs.createEnt();
    const sprite = ecs.addComponent(eid, new CSprite(
      48, 48,
      itemDef.description,
      itemDef.spriteSheet,
      itemDef.spriteSheet,
      itemDef.spriteSheet,
      itemDef.spriteSheet,
    )); 
    sprite.gridPos = randomTile!;
    ecs.addComponent(eid, new CClickable());
    ecs.addComponent(eid, new CGridCollider());
    ecs.addComponent(eid, new CTransform());
    ecs.addComponent(eid, new CItem(itemDef, 1));
  }
  
}
