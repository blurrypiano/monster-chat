import CAgent from "../comps/CAgent";
import { CItem } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import { ITileLayer } from "../systems/GridMovementSystem";
import EcsManager, { EntIdType } from "../../infra/Ecs";
import { Vec2 } from "../../infra/LinAlg";
import { ILocationContextInfo } from "../../../data/locationData";
import CGridCollider from "../comps/CGridCollider";
import findShortestPath from "../../infra/ShortestPath";

export const manhattanDistance = (p1: Vec2, p2: Vec2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

export const manhattanNeighbours = [new Vec2(0, 1), new Vec2(0, -1), new Vec2(1, 0), new Vec2(-1, 0)];

export default class LocationService {

  private _locationDescriptionFromGridPos: Map<string, ILocationContextInfo> = new Map();
  private _tilesFromLocationId: Map<number, Vec2[]> = new Map();

  private _gridPosFromId: Map<EntIdType, Vec2> = new Map();
  private _idsFromGridPos: Map<string /* vec2 string */, EntIdType[]> = new Map();
  private _staticBoundaries: Set<string>;

  constructor(
    public locationContext: { [key: number]: ILocationContextInfo }, 
    tileLayer: ITileLayer,
    boundaries: Vec2[],
  ) {

    this._staticBoundaries = new Set(boundaries.map(x => x.toString()));

    // build look up map to get location context
    for (var i = 0; i < tileLayer.width; i++) {
      for (var j = 0; j < tileLayer.height; j++) {
        const value = tileLayer.data[i * tileLayer.width + j];
        if (value > 0 && locationContext[value]) {
          var gridPos = new Vec2(j, i);
          this._locationDescriptionFromGridPos.set(gridPos.toString(), locationContext[value]);
        }

        if (this._tilesFromLocationId.has(value)) {
          const tiles = this._tilesFromLocationId.get(value)!;
          tiles.push(new Vec2(j, i));
        } else {
          const tiles = [new Vec2(j, i)];
          this._tilesFromLocationId.set(value, tiles);
        }
      }
    }
  }

  public getRandomTileAtLocation(locationId: number): Vec2 | undefined {
    const tiles = this._tilesFromLocationId.get(locationId);
    if (!tiles || tiles.length === 0) return undefined;
    const index = Math.floor(Math.random() * tiles.length);
    return tiles[index];
  }

  public lookup(pos: Vec2 | null): ILocationContextInfo | null {
    if (!pos) return null;
    return this._locationDescriptionFromGridPos.get(pos.toString()) || null;
  }

  public clear() {
    this._gridPosFromId.clear();
    this._idsFromGridPos.clear();
  }

  public upsert(id: EntIdType, gridLocation: Vec2) {
    // removes id from old location if it exsits
    if (this._gridPosFromId.has(id)) {
      const oldLocation = this._gridPosFromId.get(id)!;
      const oldPosKey = oldLocation.toString();
      const oldList = this._idsFromGridPos.get(oldPosKey)!;
      oldList.splice(oldList.indexOf(id), 1);
      if (oldList.length === 0) {
        this._idsFromGridPos.delete(oldPosKey);
      }
    }

    // then adds id
    const posKey = gridLocation.toString();
    if (!this._idsFromGridPos.has(posKey)) {
      this._idsFromGridPos.set(posKey, []);
    }
    this._idsFromGridPos.get(posKey)!.push(id);
    this._gridPosFromId.set(id, gridLocation);
  }

  public remove(id: EntIdType): boolean {
    const gridLocation = this._gridPosFromId.get(id);
    if (!gridLocation) {
      return false;
    }
    const gridPosKey = gridLocation.toString();
    const idList = this._idsFromGridPos.get(gridPosKey);
    if (!idList) {
      return false;
    }
    idList.splice(idList.indexOf(id), 1);
    this._gridPosFromId.delete(id);
    return true;
  }

  public has(id: EntIdType): boolean {
    return this._gridPosFromId.has(id);
  }

  public getLocationById(id: EntIdType): Vec2 | undefined {
    return this._gridPosFromId.get(id);
  }

  public getIdsByLocation(gridLocation: Vec2): EntIdType[] {
    const gridPosKey = gridLocation.toString();
    const idList = this._idsFromGridPos.get(gridPosKey);
    if (!idList) {
      return [];
    }
    return idList;
  }

  /**
   * 
   * @param eid1 Ent id 1
   * @param eid2 Ent id 2
   * @returns Manhattan distance between ents, -1 if invalid
   */
  public manhattanDistanceBetweenEnts(eid1: EntIdType, eid2: EntIdType) {
    const v1 = this.getLocationById(eid1);
    const v2 = this.getLocationById(eid2);
    if (!v1 || !v2) return -1;
    return manhattanDistance(v1, v2);
  }

  public getSpriteDescriptionsInRegion(ecs: EcsManager, pos: Vec2, size: number): string[] {
    var entIds = this.getIdsInRegion(pos, size);
    return entIds.map(eid => ecs.getComponent(eid, CSprite)?.description ?? "");
  }

  public getIdsInRegion(pos: Vec2, size: number): EntIdType[] {
    const entIds: EntIdType[] = [];
    const spriteLookup = this._idsFromGridPos;

    // Iterate over all positions in the region and collect the entIds at each position
    // TODO can optimize this with quadtree approach
    for (let i = pos.y - size; i <= pos.y + size; i++) {
      for (let j = pos.x - size; j <= pos.x + size; j++) {
        if (pos.x === j && pos.y === i) continue; // only gets neighbours
        const hash = new Vec2(j, i).toString();
        if (spriteLookup.has(hash)) {
          const entIdList = spriteLookup.get(hash)!;
          for (const entId of entIdList) {
            entIds.push(entId);
          }
        }
      }
    }
    return entIds;
  }

  public setAgentPathing(ecs: EcsManager, agentId: EntIdType, targetPos: Vec2, avoidNearbyObstacles: boolean = true): boolean {
    const agent = ecs.getComponent(agentId, CAgent);
    const agentCollider = ecs.getComponent(agentId, CGridCollider);
    const agentSprite = ecs.getComponent(agentId, CSprite);
    if (!agent) throw new Error('entid does have CAgent component');
    if (!agentCollider) throw new Error('entid does have CGridCollider component');
    if (!agentSprite) throw new Error('entid does have CSprite component');

    // if already moving to another position, use that in path calculation
    let agentPos = agentCollider.nextGridPos ?? agentSprite.gridPos;
    // if (agent.movementPath) return false; // agent already has a movement path
    // if (agentCollider.nextGridPos) return false; // if agent already has next position return
    if (agent.targetGridPos && agentPos.equals(agent.targetGridPos)) return true;

    let boundaries = this._staticBoundaries;
    if (avoidNearbyObstacles) {
      const dynamicObjs = this.getIdsInRegion(agentPos, 8)
        .map((v) => this.getLocationById(v)!.toString());
      boundaries = new Set([...this._staticBoundaries, ...dynamicObjs]);
    }
      
    const path = findShortestPath(agentPos, targetPos, boundaries);
    if (path) {
      console.log("Found shortest path");
      agent.movementPath = path;
      agent.movementPathIndex = 0;
      agent.targetGridPos = targetPos;
      return true;
    } else {
      console.log("Could not find path");
      agent.targetGridPos = null; // clear target grid position to avoid repeating calculation
      agent.movementPath = path;
      agent.movementPathIndex = 0;
      return false;
    }
  }

  public setAgentPathingToNeighbour(ecs: EcsManager, agentId: EntIdType, targetPos: Vec2, avoidNearbyObstacles: boolean = true): boolean {
    for (const n of manhattanNeighbours) {
      const neighbour = targetPos.add(n);
      if (this.setAgentPathing(ecs, agentId, neighbour, avoidNearbyObstacles)) {
        return true;
      }
    }
    return false;
  }
}