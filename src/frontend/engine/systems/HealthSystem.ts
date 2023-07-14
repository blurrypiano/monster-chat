import EcsManager, { EntsWith } from "../../infra/Ecs";
import CHealth from "../comps/CHealth";
import GameContext from "../GameContext";

type CompOrder = [CHealth];
const constructors = [CHealth];

export default class HealthSystem {

  // 3 minutes without food before death 
  // maxHealth / (60 fps * 60 seconds * 3 minutes)
  public decreaseRate: number = 100.0 / (60.0 * 60.0 * 10);

  public run(gc: GameContext, ecs: EcsManager): void {
    const ents: EntsWith<CompOrder> = ecs.getEntsWith(...constructors);

    const deadEids = [];
    for (const [eid, [hc]] of ents) {
      hc.health -= this.decreaseRate;
      if (hc.health < 0) {
        deadEids.push(eid);
      }
    }

    deadEids.forEach(eid => {
      console.log(`eid dead: ${eid}`);
      ecs.deleteEnt(eid);
    });
  }
}
