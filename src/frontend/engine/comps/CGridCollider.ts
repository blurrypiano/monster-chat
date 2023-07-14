import { IComponent } from "../../infra/Ecs";
import { Vec2 } from "../../infra/LinAlg";

export default class CGridCollider implements IComponent {
  public nextGridPos: Vec2 | null = null;
}
