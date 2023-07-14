import GameContext from "../GameContext";
import InventoryState, { InventoryItem, SetInventoryState } from "../InventoryState";
import { CInventory, CItem } from "../comps/CInventory";
import EcsManager, { EntIdType } from "../../infra/Ecs";
import PlayerCommandService from "../../libs/gpt-agents/PlayerCommandService";
import { CommandResponseApiModel } from "../../libs/gpt-agents/GptAgentManager";

export default class PlayerInventoryService {

  private _currentContext?: InventoryState;

  constructor(
    private readonly _gc: GameContext,
    private readonly _setInventoryContext: SetInventoryState,
    private readonly _playerCommandService: PlayerCommandService,
  ) {

  }

  public selectInventoryContext(ecs: EcsManager, agentId?: EntIdType, targetAgentId?: EntIdType) {
    if (!agentId) {
      this._setInventoryContext(undefined);
      return;
    }

    const playerEid = this._gc.playerEnt.eid;
    const inventory = ecs.getComponent(agentId, CInventory);

    const items: InventoryItem[] = agentId === playerEid
      ? this.getItemContextForPlayer(ecs, targetAgentId)
      : this.getItemContextForAgent(ecs, agentId)

    const giveCoinsOption = !targetAgentId || agentId !== playerEid
      ? undefined
      : (amount: number) => {
        const nextCommand = this._playerCommandService.getCommandResponse('give_coins', { characterId: targetAgentId, amount: amount });
        this._playerCommandService.interrupt(
          this._gc.playerEnt.eid,
          ecs,
          'Player issued new command',
          nextCommand,
        );
      }
    
    this._currentContext = {
      selectedEntId: agentId,
      agentName: 'Name',
      coins: inventory.coins,
      items,
      giveCoins: giveCoinsOption,
    }

    this._setInventoryContext(this._currentContext);
  }

  public updateInventoryContext(ecs: EcsManager, agentId: EntIdType) {
    // only update the context if the agent who's inventory was just updated
    // is the selected context to show
    if (this._currentContext?.selectedEntId !== agentId) return;
    this.selectInventoryContext(ecs, agentId);
  }

  private getItemContextForPlayer(ecs: EcsManager, targetAgentId?: EntIdType): InventoryItem[] {
    const playerEid = this._gc.playerEnt.eid;
    const inventory = ecs.getComponent(playerEid, CInventory);
    const options = targetAgentId ? ['Give'] : ['Use', 'Drop'];

    return inventory.items.map((itemId) => {
      const item = ecs.getComponent(itemId, CItem);
      return {
        name: item.def.name,
        description: item.def.description,
        options: options,
        onOption: (option: string) => {
          let nextCommand: CommandResponseApiModel | undefined = undefined;
          switch (option) {
            case 'Use':
              nextCommand = this._playerCommandService.getCommandResponse('use_item', { itemId: itemId });
              break;
            case 'Drop':
              nextCommand = this._playerCommandService.getCommandResponse('drop_item', { itemId: itemId });
              break;
            case 'Give':
                nextCommand = this._playerCommandService.getCommandResponse('give_item', { characterId: targetAgentId, itemId: itemId });
                break;
            default:
              throw new Error('Unrecognized option');
          }
          this._playerCommandService.interrupt(
            this._gc.playerEnt.eid,
            ecs,
            'Player issued new command',
            nextCommand,
          );
        },
      }
    });
  }

  private getItemContextForAgent(ecs: EcsManager, agentId: EntIdType): InventoryItem[] {
    const inventory = ecs.getComponent(agentId, CInventory);

    return inventory.items.map((itemId) => {
      const item = ecs.getComponent(itemId, CItem);
      return {
        name: item.def.name,
        description: item.def.description,
        options: [],
        onOption: (option: string) => { },
      }
    });
  }
}