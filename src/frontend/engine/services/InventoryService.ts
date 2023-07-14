import LocationService, { manhattanDistance, manhattanNeighbours } from "./LocationService";
import GameContext from "../GameContext";
import InventoryState, { InventoryItem, SetInventoryState } from "../InventoryState";
import CGridCollider from "../comps/CGridCollider";
import { CInventory, CItem, itemDefinitons } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import EcsManager, { EntIdType } from "../../infra/Ecs";
import { Vec2 } from "../../infra/LinAlg";
import PlayerInventoryService from "./PlayerInventoryService";
import CHealth from "../comps/CHealth";
import CAgent from "../comps/CAgent";
import { CommandStateInterrupted } from "../../libs/gpt-agents/GptAgentManager";
import ConversationService from "./ConversationService";
import npcData from "../../../data/npcs/NpcData";

export default class InventoryService {

  constructor(
    private readonly _playerInventoryService: PlayerInventoryService,
    private readonly _locationService: LocationService,
    private readonly _conversationService: ConversationService,
  ) {

  }

  public isNextToItem(ecs: EcsManager, agentId: EntIdType, itemId: EntIdType) {
    const agentSprite = ecs.getComponent(agentId, CSprite);
    const itemSprite = ecs.getComponent(itemId, CSprite);

    if (!agentSprite || !itemSprite) return false;
    return manhattanDistance(agentSprite.gridPos, itemSprite.gridPos) <= 1;
  }

  public pickupItem(ecs: EcsManager, agentId: EntIdType, itemId: EntIdType) {
    console.log(`target item: ${itemId}`);
    const inventory = ecs.getComponent(agentId, CInventory);

    inventory.items.push(itemId);
    ecs.removeComponent(itemId, CSprite);
    ecs.removeComponent(itemId, CGridCollider);

    this._playerInventoryService.updateInventoryContext(ecs, agentId);
  }

  public canDropItem(ecs: EcsManager, agentId: EntIdType): Vec2 | null {
    const agentSprite = ecs.getComponent(agentId, CSprite);
    if (!agentSprite) return null;
    const pos = agentSprite.gridPos;
    for (const n of manhattanNeighbours) {
      const neighbour = pos.add(n);
      const otherSprites = this._locationService.getIdsByLocation(neighbour);
      if (otherSprites.length === 0) {
        return neighbour;
      }
    }
    return null;
  }

  public isInventoryFull(ecs: EcsManager, agentId: EntIdType): boolean {
    const inventory = ecs.getComponent(agentId, CInventory);
    return inventory.items.length >= 5;
  }

  public dropItem(ecs: EcsManager, agentId: EntIdType, itemId: EntIdType) {

    const availableSpace = this.canDropItem(ecs, agentId);
    if (!availableSpace) throw new Error("There is no available space to drop the item");
    console.log(`target item: ${itemId}`);

    const item = ecs.getComponent(itemId, CItem);
    const itemDef = item.def;
    const inventory = ecs.getComponent(agentId, CInventory);

    // add components so item appears in world
    ecs.addComponent(itemId, new CGridCollider());
    const sprite = ecs.addComponent(itemId, new CSprite(
      48, 48,
      itemDef.description,
      itemDef.spriteSheet,
      itemDef.spriteSheet,
      itemDef.spriteSheet,
      itemDef.spriteSheet,
    ));
    sprite.gridPos = availableSpace;

    // remove item from inventory
    inventory.items = inventory.items.filter((v) => v !== itemId);

    this._playerInventoryService.updateInventoryContext(ecs, agentId);
  }

  public giveItem(ecs: EcsManager, itemId: EntIdType, fromAgent: EntIdType, toAgent: EntIdType) {
    const fromInventory = ecs.getComponent(fromAgent, CInventory);
    const toInventory = ecs.getComponent(toAgent, CInventory);

    fromInventory.items = fromInventory.items.filter((v) => v !== itemId);
    toInventory.items.push(itemId);

    const agent = ecs.getComponent(toAgent, CAgent);
    const item = ecs.getComponent(itemId, CItem);
    agent.interrupt = new CommandStateInterrupted(`Character ${fromAgent} gave you: ${item.def.description}`)

    const fromName = npcData.get(ecs.getComponent(fromAgent, CAgent).agentSlug)?.name ?? fromAgent;
    const toName = npcData.get(agent.agentSlug)?.name ?? fromAgent;
    const itemName = item.def.name;
    this._conversationService.addSystemMessage(ecs, fromAgent, toAgent, `${fromName} gave to ${toName}: ${itemName}`);

    this._playerInventoryService.updateInventoryContext(ecs, fromAgent);
    this._playerInventoryService.updateInventoryContext(ecs, toAgent);
  }

  public giveCoins(ecs: EcsManager, coinAmount: number, fromAgent: EntIdType, toAgent: EntIdType) {
    const fromInventory = ecs.getComponent(fromAgent, CInventory);
    const toInventory = ecs.getComponent(toAgent, CInventory);
    fromInventory.coins -= coinAmount;
    toInventory.coins += coinAmount;
    const agent = ecs.getComponent(toAgent, CAgent);
    agent.interrupt = new CommandStateInterrupted(`Character ${fromAgent} gave you ${coinAmount} coins`)

    const fromName = npcData.get(ecs.getComponent(fromAgent, CAgent).agentSlug)?.name ?? fromAgent;
    const toName = npcData.get(agent.agentSlug)?.name ?? fromAgent;
    this._conversationService.addSystemMessage(ecs, fromAgent, toAgent, `${fromName} gave ${toName} ${coinAmount} coins`);

    this._playerInventoryService.updateInventoryContext(ecs, fromAgent);
    this._playerInventoryService.updateInventoryContext(ecs, toAgent);
  }

  public hasItem(ecs: EcsManager, agentId: EntIdType, itemId: EntIdType): boolean {
    const inventory = ecs.getComponent(agentId, CInventory);
    return inventory.items.findIndex((v) => v === itemId) >= 0;
  }

  public hasCoins(ecs: EcsManager, agentId: EntIdType, coinAmount: number): boolean {
    const inventory = ecs.getComponent(agentId, CInventory);
    return coinAmount <= inventory.coins;
  }

  public useItem(ecs: EcsManager, agentId: EntIdType, itemId: EntIdType) {
    // remove item from inventory
    const inventory = ecs.getComponent(agentId, CInventory);
    inventory.items = inventory.items.filter((v) => v !== itemId);

    const item = ecs.getComponent(itemId, CItem);
    const itemDef = item.def;

    switch (itemDef.name) {
      case "Apple":
        this.useApple(ecs, agentId);
        break;
    }

    this._playerInventoryService.updateInventoryContext(ecs, agentId);
  }

  private useApple(ecs: EcsManager, agentId: EntIdType) {
    console.log('use apple!!');
    const hc = ecs.getComponent(agentId, CHealth);
    hc.health += 20;
  }
}