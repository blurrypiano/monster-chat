import EcsManager, { EntsWith, EntWith } from "../../infra/Ecs";
import { Vec2 } from "../../infra/LinAlg";
import findShortestPath from "../../infra/ShortestPath";
import CAgent from "../comps/CAgent";
import CGridCollider from "../comps/CGridCollider";
import CSprite from "../comps/CSprite";
import CTransform from "../comps/CTransform";
import GameContext from "../GameContext";
import { MoveDirection } from "./GridMovementSystem";

type CompOrder = [CAgent, CGridCollider, CTransform, CSprite];
const constructors = [CAgent, CGridCollider, CTransform, CSprite];

export default class AgentMovementSystem {

  // string hash of boundary grid position
  private staticBoundaries: Set<string>;
  constructor(boundaries: Vec2[], public readonly tileSize: number) {
    this.staticBoundaries = new Set(boundaries.map(x => x.toString()));
  }

  public run(gc: GameContext, ecs: EcsManager): void {
    const colliders: EntsWith<[CSprite, CGridCollider]> = ecs.getEntsWith(CSprite, CGridCollider);
    const ents: EntsWith<CompOrder> = ecs.getEntsWith(...constructors);
    for (const ent of ents) {
      this.runForAgent(gc, ent, colliders);
    }
  }

  private runForAgent(gc: GameContext, ent: EntWith<CompOrder>, colliders: EntsWith<[CSprite, CGridCollider]>) {
    const [eid, [, agentCollider, agentTransform, agentSprite]] = ent;

    let shouldAnimateAgent = agentSprite.animFrame % 2 !== 0;

    // why when i move the other character can move???
    
    // update agent transform if they have a next grid position
    if (agentCollider.nextGridPos) {
      const delta = agentCollider.nextGridPos.sub(agentSprite.gridPos);
      agentTransform.translation.add_(delta.mul(3));
      shouldAnimateAgent = true;

      // if they've reached the location
      const targetTranslation = delta.mul(CSprite.TILE_SIZE);
      if (agentTransform.translation.distanceCompare(targetTranslation, 0.1)) {
        agentSprite.gridPos = agentCollider.nextGridPos;
        agentCollider.nextGridPos = null;
        agentTransform.translation = new Vec2();
      }
    }

    // agent cant move if they are in a conversation
    if (gc.conversationWithEntId === eid) return;

    // try updating nextGridPos to an open position along the path
    this.maybeUpdateNextPosition(ent, colliders);

    // update character animation
    if (shouldAnimateAgent && gc.frameCount % 10 === 0) {
      agentSprite.animFrame += 1;
      agentSprite.animFrame %= 4;
    }
  }

  private maybeUpdateNextPosition(ent: EntWith<CompOrder>, colliders: EntsWith<[CSprite, CGridCollider]>) {
    const [eid, [agent, agentCollider, , agentSprite]] = ent;
    if (agentCollider.nextGridPos) return; // if agent already has next position return

    // if agent is at target position then update to standby
    if (agent.targetGridPos && agentSprite.gridPos.equals(agent.targetGridPos)) {
      agent.resetAgentMovement();
      return;
    }

    // check if agent is at current path position, if so then update to next position in path
    const currentPathPos = agent.currentPathPos;
    if (currentPathPos && agentSprite.gridPos.equals(currentPathPos)) {
      agent.movementPathIndex! += 1;
      const direction = this.getDirectionToFace(agentSprite.gridPos, agent.currentPathPos);
      if (direction) {
        agentSprite.direction = direction;
      }
    }

    // finally try to move agent to next path position if it is open
    const agentNextPathPos = agent.currentPathPos;
    if (agentNextPathPos && this.isPositionOpen(eid, agentNextPathPos, colliders)) {
      agentCollider.nextGridPos = agentNextPathPos;
    }
  }

  private getDirectionToFace(currentPos: Vec2, targetPos: Vec2 | null): MoveDirection | null {
    if (!targetPos) return null;
    if (currentPos.equals(targetPos)) return null;
    const delta = targetPos.sub(currentPos);

    if (delta.x > 0) return "right";
    if (delta.x < 0) return "left";
    if (delta.y > 0) return "down";
    if (delta.y < 0) return "up";
    return null;
  }

  /**
   * 
   * @param eid The ent id that is trying to move. Necessary so that they dont pick up self collisions
   * @param pos The grid position they want to check if its available
   * @param colliders The other colliders in the scene to check
   * @returns 
   */
  private isPositionOpen(entId: number, pos: Vec2, colliders: EntsWith<[CSprite, CGridCollider]>): boolean {
    if (this.staticBoundaries.has(pos.toString())) {
      return false;
    }
    for (const [eid, [sprites, collider]] of colliders) {
      if (entId === eid) continue;
      if (sprites.gridPos.equals(pos)) return false;
      if (collider.nextGridPos?.equals(pos)) return false;
    }
    return true;
  }

  private move(pos: Vec2, direction: MoveDirection): Vec2 {
    switch (direction) {
      case "left":
        return pos.add(new Vec2(-1, 0));
      case "right":
        return pos.add(new Vec2(1, 0));
      case "up":
        return pos.add(new Vec2(0, -1));
      case "down":
        return pos.add(new Vec2(0, 1));
    }
  }
}
