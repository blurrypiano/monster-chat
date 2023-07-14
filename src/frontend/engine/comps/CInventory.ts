import { EntIdType } from "../../infra/Ecs";
import TypedAssets from "../TypedAsset";
import { SpriteSheet } from "./CSprite";

export const itemDefinitons: IItemDefinition[] = [
  {
    name: "Caroline's Earrings",
    description: "A pair of Gold earrings with a small diamond",
    keyItem: true,
    spriteSheet: TypedAssets.spriteSheets.earrings,
  },
  {
    name: "Old sneakers",
    description: "Joshua's old sneakers",
    keyItem: true,
    spriteSheet: TypedAssets.spriteSheets.shoes,
  },
  {
    name: "Apple",
    description: "An apple, restores 20 energy when used",
    keyItem: false,
    spriteSheet: TypedAssets.spriteSheets.apple,
  },
  {
    name: "Rock",
    description: "Just a rock, maybe you could throw these at monsters to make them easier to catch",
    keyItem: false,
    spriteSheet: TypedAssets.spriteSheets.rock,
  },
  {
    name: "Coins",
    description: "Coins! Don't spend them all in one place.",
    keyItem: false,
    spriteSheet: TypedAssets.spriteSheets.coins,
  },
];

export interface IItemDefinition {
  name: string;
  description: string;
  keyItem: boolean;
  spriteSheet: SpriteSheet;
}

export class CItem {
  constructor(public readonly def: IItemDefinition, public count: number = 0) { }
}

export class CInventory {
  items: EntIdType[] = [];
  coins: number = 200;
}
