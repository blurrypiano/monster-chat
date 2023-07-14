import { townLocation } from "../../assets/collision/townLocation";
import { locationContext } from "../../data/locationData";
import LocationService from "./services/LocationService";
import { EntIdType, IGameContext } from "../infra/Ecs";
import KeyListener from "../infra/KeyListener";
import { Mat3 } from "../infra/LinAlg";
import MouseListener from "../infra/MouseListener";
import ChatGptService from "../libs/gpt-agents/ChatGptService";
import { IAiCommandService } from "../libs/gpt-agents/IAiCommandService";
import PlayerCommandService from "../libs/gpt-agents/PlayerCommandService";
import InventoryService from "./services/InventoryService";
import { SetInventoryState } from "./InventoryState";
import CGridCollider from "./comps/CGridCollider";
import { InteractiveAction } from "./comps/CInteractive";
import CSprite from "./comps/CSprite";
import CTransform from "./comps/CTransform";
import PlayerInventoryService from "./services/PlayerInventoryService";
import MovementService from "./services/MovementService";
import ConversationService from "./services/ConversationService";
import { SetConversationState } from "./ConversationState";
import GridMovementSystem from "./systems/GridMovementSystem";
import { townCollision } from "../../assets/collision/townCollision";


export type PlayerEnt = {
  eid: number,
  sprite: CSprite,
  transform: CTransform,
  collider: CGridCollider,
}

export default class GameContext implements IGameContext {

  public viewTransform = Mat3.identity();
  public frameCount: number = 0;
  public lastFrameDelta: number = 0;
  public conversationWithEntId: EntIdType | null = null;
  // public spriteLookup: Map<string /*vec2*/, EntIdType[]> = new Map<string, EntIdType[]>();

  // services should use DI or something and also shouldn't be public
  // really nothing here should be public
  public readonly aiChatService: IAiCommandService = new ChatGptService();
  public readonly locationService = new LocationService(
    locationContext, 
    townLocation, 
    GridMovementSystem.collisionsFromTileLayer(townCollision));
  public readonly movementService: MovementService = new MovementService(this.locationService);
  public readonly playerCommandService: PlayerCommandService = new PlayerCommandService();
  public readonly conversationService: ConversationService;
  public readonly inventoryService: InventoryService;
  public readonly playerInventoryService: PlayerInventoryService;



  // todo combine listeners into single input manager
  public readonly input: KeyListener;
  public readonly mouse: MouseListener;

  public readonly canvasCtx: CanvasRenderingContext2D;
  public playerEnt!: PlayerEnt;
  public currentInteraction: InteractiveAction | null = null;
  public playerStepsTaken: number = 0;

  constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly triggerReactComponentRender: () => void,
    setInventoryContext: SetInventoryState,
    setConversationState: SetConversationState,
  ) {
    this.canvasCtx = canvas.getContext('2d')!;
    this.input = new KeyListener(canvas);
    this.mouse = new MouseListener(canvas);
    this.playerInventoryService = new PlayerInventoryService(this, setInventoryContext, this.playerCommandService);
    this.conversationService = new ConversationService(setConversationState, this.locationService,  this.playerCommandService)
    this.inventoryService = new InventoryService(this.playerInventoryService, this.locationService, this.conversationService);
  }
}
