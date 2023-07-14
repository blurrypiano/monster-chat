import { SpriteSheet } from "../../frontend/engine/comps/CSprite";
import { Vec2 } from "../../frontend/infra/LinAlg";
import { IConversationModel } from "./IConversationService";

export type StarSignType = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface INpcModel {
  readonly npcId: string;
  readonly name: string;
  readonly description: string;
  readonly age: number;
  readonly starSign: StarSignType;
  readonly money: number;
  readonly items: string[];
  readonly personalHistory: string; // basically the characters backstory - static
  readonly goals: string; 
  readonly personalKnowledge: string; // basically what the character knows - dynamic

  // TODO this really shouldn't be here, just doing this for convenience now.
  // should be in its own repo

  readonly startingPos: Vec2;

  readonly conversation: IConversationModel;
  readonly leftSprites: SpriteSheet;
  readonly rightSprites: SpriteSheet;
  readonly upSprites: SpriteSheet;
  readonly downSprites: SpriteSheet;


  // personalContext: mood, tiredness, hunger, ill, etc information about the current state of the character
  // localContext: information about the current state of the environment around the character
  // etc.
}

export default interface INpcRepo {
  getById(npcId: string): Promise<INpcModel>;
  update(updated: INpcModel): Promise<INpcModel>;
}
