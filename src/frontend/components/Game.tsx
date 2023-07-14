import React, { useEffect, useRef, useState } from 'react';
import { Vec2 } from '../infra/LinAlg';
import Conversation, { ConversationProps } from './Conversation';
import '../styles/components/Game.css';
import GameCanvas from './GameCanvas';
import backgroundImgPath from "../../assets/img/townMap400.png";
import EcsManager, { EntsWith } from '../infra/Ecs';
import CBackgroundTile from '../engine/comps/CBackgroundTile';
import CTransform from '../engine/comps/CTransform';
import BackgroundRenderSystem from '../engine/systems/rendering/BackgroundRenderSystem';
import GameContext from '../engine/GameContext';
import SpriteRenderSystem from '../engine/systems/rendering/SpriteRenderSystem';
import CSprite, { SpriteSheet } from '../engine/comps/CSprite';
import CGridCollider from '../engine/comps/CGridCollider';
import GridMovementSystem from '../engine/systems/GridMovementSystem';
import bg1 from "../../assets/img/townBackground/image_part_001.png";
import bg2 from "../../assets/img/townBackground/image_part_002.png";
import bg3 from "../../assets/img/townBackground/image_part_003.png";
import bg4 from "../../assets/img/townBackground/image_part_004.png";
import bg5 from "../../assets/img/townBackground/image_part_005.png";
import bg6 from "../../assets/img/townBackground/image_part_006.png";
import bg7 from "../../assets/img/townBackground/image_part_007.png";
import bg8 from "../../assets/img/townBackground/image_part_008.png";
import bg9 from "../../assets/img/townBackground/image_part_009.png";
import bg10 from "../../assets/img/townBackground/image_part_010.png";
import bg11 from "../../assets/img/townBackground/image_part_011.png";
import bg12 from "../../assets/img/townBackground/image_part_012.png";
import bg13 from "../../assets/img/townBackground/image_part_013.png";
import bg14 from "../../assets/img/townBackground/image_part_014.png";
import bg15 from "../../assets/img/townBackground/image_part_015.png";
import bg16 from "../../assets/img/townBackground/image_part_016.png";
import fg1 from "../../assets/img/townForeground/image_part_001.png";
import fg2 from "../../assets/img/townForeground/image_part_002.png";
import fg3 from "../../assets/img/townForeground/image_part_003.png";
import fg4 from "../../assets/img/townForeground/image_part_004.png";
import fg5 from "../../assets/img/townForeground/image_part_005.png";
import fg6 from "../../assets/img/townForeground/image_part_006.png";
import fg7 from "../../assets/img/townForeground/image_part_007.png";
import fg8 from "../../assets/img/townForeground/image_part_008.png";
import fg9 from "../../assets/img/townForeground/image_part_009.png";
import fg10 from "../../assets/img/townForeground/image_part_010.png";
import fg11 from "../../assets/img/townForeground/image_part_011.png";
import fg12 from "../../assets/img/townForeground/image_part_012.png";
import fg13 from "../../assets/img/townForeground/image_part_013.png";
import fg14 from "../../assets/img/townForeground/image_part_014.png";
import fg15 from "../../assets/img/townForeground/image_part_015.png";
import fg16 from "../../assets/img/townForeground/image_part_016.png";
import CForegroundTile from '../engine/comps/CForegroundTile';
import ForegroundRenderSystem from '../engine/systems/rendering/ForegroundRenderSystem';
import { townCollision } from '../../assets/collision/townCollision';
import TypedAssets from '../engine/TypedAsset';
import CClickable from '../engine/comps/CClickable';
import MousePickerSystem from '../engine/systems/MousePickerSystem';
import AgentMovementSystem from '../engine/systems/AgentMovementSystem';
import CAgent from '../engine/comps/CAgent';
import CInteractive, { InteractiveAction } from '../engine/comps/CInteractive';
import PlayerInteractionSystem from '../engine/systems/PlayerInteractionSystem';
import npcData from '../../data/npcs/NpcData';
import SpriteLocationSystem from '../engine/systems/SpriteLocationSystem';
import { CInventory, CItem, IItemDefinition, itemDefinitons } from '../engine/comps/CInventory';
import AgentCommandSystem from '../engine/systems/AgentCommandSystem';
import PlayerCommandSystem from '../engine/systems/PlayerCommandSystem';
import Inventory from './Inventory';
import InventoryState, { SetInventoryState } from '../engine/InventoryState';
import HealthSystem from '../engine/systems/HealthSystem';
import CHealth from '../engine/comps/CHealth';
import ConversationState from '../engine/ConversationState';
import ConversationContainer from './conversation/ConversationContainer';
import AppleSystem from '../engine/systems/AppleSystem';


const backgroundTilePaths = [
  [bg1, bg2, bg3, bg4],
  [bg5, bg6, bg7, bg8],
  [bg9, bg10, bg11, bg12],
  [bg13, bg14, bg15, bg16],
];

const foregroundTilePaths = [
  [fg1, fg2, fg3, fg4],
  [fg5, fg6, fg7, fg8],
  [fg9, fg10, fg11, fg12],
  [fg13, fg14, fg15, fg16],
];

const makeBackground = (ecs: EcsManager) => {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const backgroundEnt = ecs.createEnt();
      ecs.addComponent(backgroundEnt, new CBackgroundTile(backgroundTilePaths[j][i], 768, 768));
      const transform = ecs.addComponent(backgroundEnt, new CTransform());
      transform.translation = new Vec2(i * 768, j * 768);
    }
  }
}

const makeForeground = (ecs: EcsManager) => {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const foregroundEnt = ecs.createEnt();
      ecs.addComponent(foregroundEnt, new CForegroundTile(foregroundTilePaths[j][i], 768, 768));
      const transform = ecs.addComponent(foregroundEnt, new CTransform());
      transform.translation = new Vec2(i * 768, j * 768);
    }
  }
}

const startConversation = (gc: GameContext, ecs: EcsManager, eid: number): InteractiveAction => {
  // TODO look at player
  gc.conversationWithEntId = eid;
  gc.triggerReactComponentRender();

  // return an infinite generator that does nothing
  return function* (){
    while (true) {
      if (!gc.conversationWithEntId) return;
      yield;
    }
  }();
}

const makeNPC = (gc: GameContext, ecs: EcsManager, npcId: string) => {
  var npcInfo = npcData.get(npcId)!;

  const entId = ecs.createEnt();
  const sprite =ecs.addComponent(entId, new CSprite(
    48, 68,
    npcInfo.description,
    npcInfo.leftSprites,
    npcInfo.rightSprites,
    npcInfo.upSprites,
    npcInfo.downSprites,
  )); 
  ecs.addComponent(entId, new CClickable());
  const collider = ecs.addComponent(entId, new CGridCollider());
  sprite.gridPos = npcInfo.startingPos;
  const transform = ecs.addComponent(entId, new CTransform());
  const agent = ecs.addComponent(entId, new CAgent(npcInfo.npcId, gc.aiChatService));
  ecs.addComponent(entId, new CInteractive(startConversation))
  ecs.addComponent(entId, new CInventory());
  ecs.addComponent(entId, new CHealth());
}

const makePlayer = (gc: GameContext, ecs: EcsManager) => {
  const playerEntId = ecs.createEnt();
  const sprite = ecs.addComponent(playerEntId, new CSprite(
    48, 68,
    "The player character Brendan.",
    TypedAssets.spriteSheets.playerLeft,
    TypedAssets.spriteSheets.playerRight,
    TypedAssets.spriteSheets.playerUp,
    TypedAssets.spriteSheets.playerDown,
  )); 
  ecs.addComponent(playerEntId, new CClickable());
  const collider = ecs.addComponent(playerEntId, new CGridCollider());
  sprite.gridPos = new Vec2(21, 34);
  const transform = ecs.addComponent(playerEntId, new CTransform());
  ecs.addComponent(playerEntId, new CInventory());
  ecs.addComponent(playerEntId, new CHealth(1000, 1000));

  // players agent
  var npcInfo = npcData.get("@joshua")!;
  const agent = ecs.addComponent(playerEntId, new CAgent(npcInfo.npcId, gc.playerCommandService));

  return {eid: playerEntId, sprite, transform, collider};
}

const pickUpItem = (gc: GameContext, ecs: EcsManager, eid: number): InteractiveAction => {

  // return an infinite generator that does nothing
  // eslint-disable-next-line require-yield
  return function* (){
    return;
  }();
}

const makeItem = (ecs: EcsManager, itemDef: IItemDefinition, count: number) => {
  const eid = ecs.createEnt();
  const sprite = ecs.addComponent(eid, new CSprite(
    48, 48,
    itemDef.description,
    itemDef.spriteSheet,
    itemDef.spriteSheet,
    itemDef.spriteSheet,
    itemDef.spriteSheet,
  )); 
  ecs.addComponent(eid, new CClickable());

  const gridPos = new Vec2(19, 36);
  const collider = ecs.addComponent(eid, new CGridCollider());
  sprite.gridPos = gridPos;
  const transform = ecs.addComponent(eid, new CTransform());
  ecs.addComponent(eid, new CItem(itemDef, count));
}

const setupGame = (gameState: GameState) => {
  console.log('setup game');

  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  const gc = gameState.gc;
  const ecs = gameState.ecs;
  const canvas = gameState.gc.canvas;

  ecs.createIndex(CBackgroundTile, CTransform);
  ecs.createIndex(CForegroundTile, CTransform);
  ecs.createIndex(CSprite, CTransform);
  ecs.createIndex(CSprite, CTransform, CClickable);
  ecs.createIndex(CAgent, CGridCollider, CTransform, CSprite);
  ecs.createIndex(CInteractive, CGridCollider);
  ecs.createIndex(CSprite, CGridCollider);
  ecs.createIndex(CSprite, CClickable, CGridCollider, CTransform, CItem);

  makeBackground(ecs);
  makeForeground(ecs);

  gc.playerEnt = makePlayer(gc, ecs);

  // make npcs
  // for (const [npcId,] of npcData.entries()) {
  //   makeNPC(gc, ecs, npcId);
  // }
  makeNPC(gc, ecs, "@henry");
  makeNPC(gc, ecs, "@jenny");
  makeNPC(gc, ecs, "@caroline");

  // make item
  makeItem(ecs, itemDefinitons.find(x => x.name === 'Apple')!, 1)

  const collisionBoundaries = GridMovementSystem.collisionsFromTileLayer(townCollision);

  const backgroundRenderSystem = new BackgroundRenderSystem();
  const foregroundRenderSystem = new ForegroundRenderSystem();
  const spriteRenderSystem = new SpriteRenderSystem();
  // const gridMovementSystem = new GridMovementSystem(collisionBoundaries, 48);
  const mousePickerSystem = new MousePickerSystem(gc.playerInventoryService, gc.conversationService);
  // const playerInteractionSystem = new PlayerInteractionSystem();

  // todo change to use location service
  const agentMovementSystem = new AgentMovementSystem(collisionBoundaries, 48);
  const spriteLocationSystem = new SpriteLocationSystem(gc.locationService);
  const appleSystem = new AppleSystem();
  const agentCommandSystem = new AgentCommandSystem();
  const healthSystem = new HealthSystem();
  const playerCommandSystem = new PlayerCommandSystem(
    gc.playerCommandService, 
    gc.locationService, 
    gc.mouse, 
    gc.input,
    gc.conversationService,
  );

  const camera = new CTransform();
  

  // we need the order of the constructors to enforce the typing
  // const ents = ecs.getEntsWith(CTransform, CBackgroundTile);
  // const ents = ecs.getEntsWith<[CBackgroundTile, CTransform]>(CTransform, CBackgroundTile);
  let lastUpdateTime = performance.now();
  agentCommandSystem.init(gc, ecs);

  const setCameraToPlayer = () => {
    const sprite = gc.playerEnt.sprite;
    const playerWorldPos = gc.playerEnt.sprite.worldPosition.add(gc.playerEnt.transform.translation);
    const centerCharOffset = new Vec2(
      canvas.width * 0.5 - sprite.width * 0.5, 
      canvas.height * 0.5 - sprite.height * 0.5);
    camera.translation = playerWorldPos.sub(centerCharOffset);
  }

  setCameraToPlayer();

  /************************************
   ***** Updates the game state *******
   ************************************/
  const updateGame = async () => {
    const currentTime = performance.now();
    gc.lastFrameDelta = (currentTime - lastUpdateTime) / 1000;
    
    const key = gc.input.getLastKeyDown("a", "w", "s", "d");
    if (key === "a") camera.translation.x -= 5;
    else if (key === "d") camera.translation.x += 5;
    else if (key === "w") camera.translation.y -= 5;
    else if (key === "s") camera.translation.y += 5;
    // setCameraToPlayer();
    gc.viewTransform = camera.mat3();

    playerCommandSystem.run(gc, ecs);
    mousePickerSystem.run(gc, ecs);
    healthSystem.run(gc, ecs);
    // playerInteractionSystem.run(gc, ecs);
    // gridMovementSystem.run(gc, ecs); commenting out for now since we'll use the agent movement system for the player
    await agentCommandSystem.runAsync(gc, ecs);
    agentMovementSystem.run(gc, ecs);
    spriteLocationSystem.run(gc, ecs);
    appleSystem.run(gc, ecs);

    lastUpdateTime = currentTime;
  };

  /**
   * Renders all content in the game
   */
  const drawGame = async () => {

    const ents: EntsWith<[CTransform, CBackgroundTile]> = ecs.getEntsWith(CTransform, CBackgroundTile);
    backgroundRenderSystem.run(gc, ents);
    spriteRenderSystem.run(gc, ecs);
    const fgEnts: EntsWith<[CTransform, CForegroundTile]> = ecs.getEntsWith(CTransform, CForegroundTile);
    foregroundRenderSystem.run(gc, fgEnts);

    // Call requestAnimationFrame to update and draw the game on the next frame
    requestAnimationFrame(gameLoop);
  };

  const gameLoop = async () => {
    await updateGame();
    await drawGame();
    gc.frameCount++;
  };

  // Call gameLoop to start the game loop
  gameLoop();
}

export interface GameState {
  readonly ecs: EcsManager;
  readonly gc: GameContext;
  readonly setInventoryContext: SetInventoryState;
  // todo move services out of game context and instead handle with dependency injection
}

const Game = () => {
  console.log("Refreshed Game Component");
  const [canvasSize, setCanvasSize] = useState(new Vec2(1024, 576));
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [, setRefreshComponentState] = useState(0);
  const [, setCanvasLoaded] = useState(false);

  const [inventoryContext, setInventoryContext] = useState<InventoryState>();
  const [conversationState, setConversationState] = useState<ConversationState>();

  console.log(inventoryContext);

  const resizeCanvas = () => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;
    // maintain aspect ratio
    const width = canvasContainer.clientWidth;
    const height =  (576 / 1024) * width;
    setCanvasSize(new Vec2(width, height));
    console.log(`resize canvas to ${width}, ${height}`);
  }

  useEffect(() => {
    // add window resize listener
    window.addEventListener('resize', () => {
      resizeCanvas();
    });
  }, [])

  const handleCanvasLoaded = (canvas: HTMLCanvasElement) => {
    const newGameState: GameState = {
      ecs: new EcsManager(),
      // most game state changes don't require a re-render. So instead we
      // provide a function to trigger a refresh manually for use in the few cases it does 
      gc: new GameContext(
        canvas, 
        () => setRefreshComponentState(x => x + 1), 
        setInventoryContext,
        setConversationState),
      setInventoryContext,
    }

    setCanvasLoaded(x => {
      if (x) return true;
      setupGame(newGameState);
      setGameState(newGameState);
      return true;
    })

    // resize canvas after the game has 
    // a bit of time to load
    setTimeout(resizeCanvas, 200);
  }

  const conversationProps: ConversationProps = {
    maxHeight: canvasSize.y,
    gameState: gameState ?? undefined,
    conversationWithEntId: gameState?.gc.conversationWithEntId ?? undefined,
  };

  return (
    <div className="canvas-chat-container">
      <div className="canvas-container" ref={canvasContainerRef}> 
        <GameCanvas canvasSize={canvasSize} onCanvasLoaded={handleCanvasLoaded}/>
        <Inventory context={inventoryContext} />
      </div>
      <div className="chat-container"> 
        <ConversationContainer  {...conversationProps} conversationState={conversationState}/> 
      </div>
    </div>
  );
}

export default Game;
