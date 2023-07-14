import npcData from "../../data/npcs/NpcData";
import INpcRepo, { INpcModel } from "../interfaces/INpcRepo";

export default class NpcRepo implements INpcRepo {

  public async getById(npcId: string): Promise<INpcModel> {
    return this.getNpc(npcId);
  }

  public async update(updated: INpcModel): Promise<INpcModel> {
    this.getNpc(updated.npcId);
    npcData.set(updated.npcId, updated);
    return updated;
  }

  private getNpc(npcId: string): INpcModel {
    const npc = npcData.get(npcId)
    if (!npc) throw new Error(`NpcRepo could not find model with id ${npcId}`);
    return npc;
  }
}
