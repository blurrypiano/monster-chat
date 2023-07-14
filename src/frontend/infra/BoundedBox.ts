import CSprite from "../engine/comps/CSprite";
import CTransform from "../engine/comps/CTransform";
import { Vec2 } from "./LinAlg"

export default class BoundedBox {

  public readonly bottomRight: Vec2
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly w: number,
    public readonly h: number
  ) {
    this.bottomRight = new Vec2(x + w, y + h);
  }

  public contains(x: number, y: number): boolean {
    return x > this.x && x < this.bottomRight.x
      && y > this.y && y < this.bottomRight.y;
  }

  public equals(other: BoundedBox): boolean {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.w === other.w &&
      this.h === other.h
    );
  }

  static forSpriteTransform(sprite: CSprite, transform: CTransform): BoundedBox {
    const bottomLeftTile = sprite.worldPosition.add(transform.translation);
    const topLeftSprite = bottomLeftTile.sub(new Vec2(0, sprite.height));
    return new BoundedBox(
      topLeftSprite.x,
      topLeftSprite.y,
      sprite.width,
      sprite.height,
    );
  }

}