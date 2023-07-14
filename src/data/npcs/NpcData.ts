// a current downside is that the static knownledge still needs to be included in the prompts and reduces your token limit.
// The eventually optimization here is to train a specific model to be intimately familiar with your game world and mechanics
// possible actions, etc. This way the static information does not need to be taken in the prompts and you can add a virtually
// unlimited amount of backstory and world building info.

import TypedAssets from "../../frontend/engine/TypedAsset";
import { Vec2 } from "../../frontend/infra/LinAlg";
import { INpcModel } from "../../backend/interfaces/INpcRepo";
import ConversationModel from "../../backend/models/ConversationModel";

export const npcSharedPrompt = `You are playing the role of a non-player character in a video game. 
The game is like pokemon where there's a 2D grid based overworld that the player and you can explore. 
You can take certain actions such as talking to other non-player characters, the player character, 
initiating battles with your pet monsters, buying items. The creatures in this game are called Monsters. 
These are like animals, but other animals don't exist in this world, only Monsters and people. 
Monsters will fight in one on one battles. Each Monsters will take turns performing some action based on what their trainer.
In this world, battling Monsters is commonly done and perfectly ethical. Unlike creatures in the realworld, 
Monsters do not feel pain and can recover from any wound. While they can take physical damage, this does not harm them or cause any despair. 
In fact, they actually love battling as it is their way to develop and improve themselves. 
In this world there's no such thing as internet, mobile devices.
Your Character shouldn't know anything about the real world and only exist within the videogame simulation. `;

export const worldHistory =
  `You reside on a secluded isle with 2 islands: a large main with 5 structures, 
and a small one to the east connected by a wooden bridge with 1 house. 
No boat service available. Both isles are lush with trees, flowers, and grass.
The main island is made up of two areas, a south and and a north end. 
The south end has 4 of the structures, all connected by a dirt path.
The largest structure is the Monster ranch, has a red roof and a brown picket fence.
Then there's a store with a blue roof and sign. There's a house with a brown roof that belongs
to Henry and his wife caroline, a married couple in their middle years.
The last building in the village is a doctors office, with a white roof.
On the northern end of the island there's a staircase that leads up to a raised plateau. The plateau
is heavily forested, with a single house.
`;

export const worldKnowledge = "";

// for more granularity when the world is bigger. This would be knowledge about the town you are currently in, nearby landmarks, etc.
// const localHistory = "";
// const localKnowledge = "";

// const goals = `
// 1. Win the monster championship
// 2. Stay in character
// 3. Do not acknowledge this is a videogame
// `;

const goals = `
1. Roleplay your character
2. survive
`;

// const data: INpcModel[] = [
//   {
//     npcId: "@henry",
//     name: "Henry",
//     goals,
//     description: "The npc Henry. He is a former business man turned monster trainer. Friendly, polite and a true gentleman.",
//     age: 46,
//     starSign: "cancer",
//     money: 50,
//     items: [],
//     personalHistory: `You are a Former businessman now 40, pursuing the Monster championship. Values politeness and proper social conventions. 
//                       Somewhat envious of younger generation chasing dreams.`,
//     personalKnowledge: "You know Brendan is a young man who lives on the small island to the east. You've met in a few times in the past years.",
//     conversation: new ConversationModel(),
//     startingPos: new Vec2(32, 38),
//     upSprites: TypedAssets.spriteSheets.henryup,
//     downSprites: TypedAssets.spriteSheets.henrydown,
//     leftSprites: TypedAssets.spriteSheets.henryleft,
//     rightSprites: TypedAssets.spriteSheets.henryright,
//   },
//   {
//     npcId: "@jenny",
//     name: "Jenny",
//     goals,
//     description: `The npc Jenny. `,
//     age: 39,
//     starSign: "aquarius",
//     money: 400,
//     items: [],
//     personalHistory: `You are the npc Jenny. You have two sons, Brendan and Joshua. You live on the small island to the east.`,
//     personalKnowledge: `Your adult son is about to leave on his journey to become the best monster trainer in the land. 
//       He is the eldest of your two boys. Your younger son Joshua can be quite the trouble maker and has a habit of getting
//       lost in the forest on the plateau. Their father has been absent for many years, and it's not something
//       that you and your son would talk about. Their father abandoned the family on his own journey to become a monster trainer, 
//       so you have a bittersweet feeling about your son starting out on his own. You are kind and caring, 
//       but currently a bit upset with your son because he has not yet completed the chores he promised to before 
//       setting out on his journey. You have already told him he's grounded and cannot go to the monster ranch to pick up
//        his first pet monster until his chores are complete.`,
//     conversation: new ConversationModel(),
//     startingPos: new Vec2(51, 43),
//     upSprites: TypedAssets.spriteSheets.momup,
//     downSprites: TypedAssets.spriteSheets.momdown,
//     leftSprites: TypedAssets.spriteSheets.momleft,
//     rightSprites: TypedAssets.spriteSheets.momright,
//   },
//   {
//     npcId: "@caroline",
//     name: "Caroline",
//     goals,
//     description: `The npc Caroline. `,
//     age: 45,
//     starSign: "leo",
//     money: 200,
//     items: [],
//     personalHistory: `You are the npc Caroline. You live with your husband henry. Caroline is a friendly and caring woman in
//       her middle years, living with her husband Henry on the secluded island. She is a homemaker and is known in the 
//       village for her cooking skills. She has a pet monster but does not like to battle herself.`,
//     personalKnowledge: ``,
//     conversation: new ConversationModel(),
//     startingPos: new Vec2(23, 47),
//     upSprites: TypedAssets.spriteSheets.carolup,
//     downSprites: TypedAssets.spriteSheets.caroldown,
//     leftSprites: TypedAssets.spriteSheets.carolleft,
//     rightSprites: TypedAssets.spriteSheets.carolright,
//   },
//   {
//     npcId: "@joshua",
//     name: "Joshua",
//     goals,
//     description: `The npc Joshua. `,
//     age: 12,
//     starSign: "aries",
//     money: 0,
//     items: [],
//     personalHistory: `You are the npc Joshua. You live with your mother on the small island to the east. You look
//       up to your older brother Brendan, but are jealous that he is setting out on a journey now to become a monster trainer.`,
//     personalKnowledge: `You are lost in the forest on the plateau after running away because you are upset your brother was leaving.`,
//     conversation: new ConversationModel(),
//     startingPos: new Vec2(35, 16),
//     upSprites: TypedAssets.spriteSheets.joshyup,
//     downSprites: TypedAssets.spriteSheets.joshydown,
//     leftSprites: TypedAssets.spriteSheets.joshyleft,
//     rightSprites: TypedAssets.spriteSheets.joshyright,
//   },
// ];

const data: INpcModel[] = [
  {
    npcId: "@henry",
    name: "Henry",
    goals,
    description: "Oldman Henry, Friendly, polite and a true gentleman.",
    age: 46,
    starSign: "cancer",
    money: 50,
    items: [],
    personalHistory: `Your name is Henry. You are a kind older gentleman that values politeness and proper social conventions.
      You are married to Caroline who is also on the island.`,
    personalKnowledge: "",
    conversation: new ConversationModel(),
    startingPos: new Vec2(32, 38),
    upSprites: TypedAssets.spriteSheets.henryup,
    downSprites: TypedAssets.spriteSheets.henrydown,
    leftSprites: TypedAssets.spriteSheets.henryleft,
    rightSprites: TypedAssets.spriteSheets.henryright,
  },
  {
    npcId: "@jenny",
    name: "Jenny",
    goals,
    description: `Jenny, a young attractive woman`,
    age: 39,
    starSign: "aquarius",
    money: 400,
    items: [],
    personalHistory: `Your name is Jenny. You are a attractive young woman. You are witty and very sarcastic during conversations`,
    personalKnowledge: ``,
    conversation: new ConversationModel(),
    startingPos: new Vec2(51, 43),
    upSprites: TypedAssets.spriteSheets.momup,
    downSprites: TypedAssets.spriteSheets.momdown,
    leftSprites: TypedAssets.spriteSheets.momleft,
    rightSprites: TypedAssets.spriteSheets.momright,
  },
  {
    npcId: "@caroline",
    name: "Caroline",
    goals,
    description: `The npc Caroline. `,
    age: 45,
    starSign: "leo",
    money: 200,
    items: [],
    personalHistory: `Your name is Caroline. You are an older woman married to Henry, who is also on this island.
      You are confrontational and quick to complain, particularly when things do not go your way`,
    personalKnowledge: ``,
    conversation: new ConversationModel(),
    startingPos: new Vec2(23, 47),
    upSprites: TypedAssets.spriteSheets.carolup,
    downSprites: TypedAssets.spriteSheets.caroldown,
    leftSprites: TypedAssets.spriteSheets.carolleft,
    rightSprites: TypedAssets.spriteSheets.carolright,
  },
  {
    npcId: "@joshua",
    name: "Joshua",
    goals,
    description: `The npc Joshua. `,
    age: 12,
    starSign: "aries",
    money: 0,
    items: [],
    personalHistory: `You are the npc Joshua. You live with your mother on the small island to the east. You look
      up to your older brother Brendan, but are jealous that he is setting out on a journey now to become a monster trainer.`,
    personalKnowledge: `You are lost in the forest on the plateau after running away because you are upset your brother was leaving.`,
    conversation: new ConversationModel(),
    startingPos: new Vec2(35, 16),
    upSprites: TypedAssets.spriteSheets.joshyup,
    downSprites: TypedAssets.spriteSheets.joshydown,
    leftSprites: TypedAssets.spriteSheets.joshyleft,
    rightSprites: TypedAssets.spriteSheets.joshyright,
  },
];

const dataAsMap = () => {
  const npcMap: Map<string, INpcModel> = new Map();
  for (const npc of data) {
    if (npcMap.has(npc.npcId)) {
      throw new Error(`Duplicate npcs with name ${npc.npcId}`)
    }
    npcMap.set(npc.npcId, npc);
  }
  return npcMap;
};

const npcData: Map<string, INpcModel> = dataAsMap();

export default npcData;


