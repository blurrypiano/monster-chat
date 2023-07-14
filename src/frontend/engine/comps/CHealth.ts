import { IComponent } from "../../infra/Ecs";

export default class CHealth implements IComponent {

  constructor(
    public maxHealth: number = 100,
    private _health: number = 100,
  ) { }

  public get health() {
    return this._health;
  }

  public set health(value: number) {
    this._health = Math.min(this.maxHealth, value);
  }
}
