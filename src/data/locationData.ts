import { Vec2 } from "../frontend/infra/LinAlg";

export interface ILocation {
  entrance: Vec2;
  outside: Vec2;
}

const locationData: { [key: string]: ILocation } = {
  ranch: {
    entrance: new Vec2(24, 45),
    outside: new Vec2(24, 48),
  },
  store: {
    entrance: new Vec2(21, 32),
    outside: new Vec2(21, 35),
  },
  "Henry and Carolines house": {
    entrance: new Vec2(32, 36),
    outside: new Vec2(32, 39),
  },
  "Doctors office": {
    entrance: new Vec2(15, 43),
    outside: new Vec2(15, 46),
  },
  "Brendan's house": {
    entrance: new Vec2(54, 42),
    outside: new Vec2(54, 45),
  },
  "forest on the plateau": {
    entrance: new Vec2(31, 19),
    outside: new Vec2(31, 19),
  },
  "abandoned shed in the forest": {
    entrance: new Vec2(19, 15),
    outside: new Vec2(19, 18),
  },
};

export interface ILocationContextInfo {
  description: string;
  locationId: number;
}

// starts with time, Then, a few moments later {timeMsg} at {locationDescription}
// export const locationContext: { [key: number]: ILocationContextInfo } = {
//   222: {
//     description: `the north-west edge of the main island. The ocean is to the west, and the cliffside of the plataeu to the east.
//       Theres a few trees and a patch of long grass where monsters can commonly be found. The town is a short walk south`,
//     locationId: 222,
//   },
//   254: {
//     description: `the north-east edge of the main island. The ocean is to the east, and the cliffside of the plataeu to the west.
//       Theres a few trees and a patch of long grass where monsters can commonly be found. The town is a short walk south`,
//     locationId: 222,
//   },
//   188: {
//     description: `the plateau. The forest is dense and there are many large trees.
//       There are a few patches of long grass where monsters can commonly be found. The town is a short walk south`,
//     locationId: 188,
//   },
//   190: {
//     description: `the plateau. The forest is dense and there are many large trees. You are standing in front of
//       a small shed, that is surprisingly well maintained.
//       There are a few patches of long grass where monsters can commonly be found. The town is a short walk south`,
//     locationId: 190,
//   },
//   220: {
//     description: `the town on the main island`,
//     locationId: 220,
//   },
//   253: {
//     description: `the bridge connecting the main island with the small island to the east. The bridge is small and made
//       of wood, so small in fact that you wouldn't be able to squeeze past someone coming in the opposite direction.`,
//     locationId: 253,
//   },
//   221: {
//     description: `the small island to the east of the main land. The island has a single residence that belongs to brendan.
//       It is well kept with many flowers, and connected to the main land by a small wooden bridge.`,
//     locationId: 221,
//   },
//   191: {
//     description: `the small fenced in area of the monster racnch. Theres a patch of long grass, a few small trees and bushes
//       To leave this area you must go through the ranch's side door and out its main entrance.`,
//     locationId: 191,
//   },
//   219: {
//     description: `the town on the main island, just infront of the doctors office`,
//     locationId: 219,
//   },
//   189: {
//     description: `the town on the main island, just infront of the store`,
//     locationId: 189,
//   },
//   252: {
//     description: `the town on the main island, just infront of the Henry and Caroline's house`,
//     locationId: 252,
//   },
//   251: {
//     description: `the town on the main island, just infront of the ranch's main entrace`,
//     locationId: 251,
//   },
// };

export const locationContext: { [key: number]: ILocationContextInfo } = {
  222: {
    description: `the north-west edge of the main island. The ocean is to the west, and the cliffside of the plataeu to the east.
      There are a few trees. The town is a short walk south`,
    locationId: 222,
  },
  254: {
    description: `the north-east edge of the main island. The ocean is to the east, and the cliffside of the plataeu to the west.
      Theres a few trees and a patch of long grass where monsters can commonly be found. The town is a short walk south`,
    locationId: 222,
  },
  188: {
    description: `the plateau on the main island. The forest is dense and there are many large trees.`,
    locationId: 188,
  },
  190: {
    description: `The shed on the plateau. The forest is dense and there are many large trees. There is a small shed nearby`,
    locationId: 190,
  },
  220: {
    description: `the center of town on the main island`,
    locationId: 220,
  },
  253: {
    description: `the bridge connecting the main island with the small island to the east. The bridge is small and made
      of wood, you wouldn't be able to squeeze past someone coming in the opposite direction.`,
    locationId: 253,
  },
  221: {
    description: `the small island to the east of the main island. The island has a single residence.
      It is connected to the main island by a small wooden bridge.`,
    locationId: 221,
  },
  // 191: {
  //   description: `the small fenced in area of the monster racnch. Theres a patch of long grass, a few small trees and bushes
  //     To leave this area you must go through the ranch's side door and out its main entrance.`,
  //   locationId: 191,
  // },
  219: {
    description: `the town on the main island, nearby the doctors office`,
    locationId: 219,
  },
  189: {
    description: `the town on the main island, nearby the store`,
    locationId: 189,
  },
  252: {
    description: `the town on the main island, nearby a home with a brown roof`,
    locationId: 252,
  },
  251: {
    description: `the town on the main island, nearby a home with a red roof and fenced in yard`,
    locationId: 251,
  },
};
export default locationData;