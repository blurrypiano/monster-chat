import LocationService from "../services/LocationService";
import EcsManager, { EntIdType } from "../../infra/Ecs";
import KeyListener from "../../infra/KeyListener";
import { Vec2 } from "../../infra/LinAlg";
import MouseListener from "../../infra/MouseListener";
import { CommandResponseApiModel, CommandStateInterrupted } from "../../libs/gpt-agents/GptAgentManager";
import PlayerCommandService from "../../libs/gpt-agents/PlayerCommandService";
import GameContext from "../GameContext";
import GoToCommand from "../commands/GoToCommand";
import PickUpItemCommand from "../commands/PickUpItemCommand";
import CAgent from "../comps/CAgent";
import { CItem } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import FollowCommand from "../commands/FollowCommand";
import ConversationService from "../services/ConversationService";
import SaySomethingCommand from "../commands/SaySomethingCommand";

type PlayerInputState = 'goto' | 'nothing' | 'pickup' | 'conversation' | 'follow';
// gets input from the player, and decodes it into a command
// that is then added to the player command service, so the player
// agent can act appropriately

// clicking somewhere uses goto target
// clicking item moves to item and picks it up
// starting conversations
export default class PlayerCommandSystem {

  private _state: PlayerInputState = 'nothing';

  constructor(
    private readonly _commandService: PlayerCommandService,
    private readonly _locationService: LocationService,
    private readonly _mouse: MouseListener,
    private readonly _keyboard: KeyListener,
    private readonly _conversationService: ConversationService,
  ) {

  }

  public run(gc: GameContext, ecs: EcsManager): void {
    this._state = this.getCurrentState();
    if (this._keyboard.getLastKeyDown('z')) throw new Error('Player quit!');
    if (this._state === 'goto') {
      this.goToComamnd(gc, ecs);
    } else if (this._state === 'pickup') {
      this.pickupCommand(gc, ecs);
    } else if (this._state === 'follow') {
      this.followCommand(gc, ecs);
    }
  }

  private getCurrentState() {
    const lastKey = this._keyboard.getLastKeyDown('q', 'g', 'p', 'f');
    if (lastKey === 'q') return 'nothing';
    if (lastKey === 'g') return 'goto';
    if (lastKey === 'p') return 'pickup';
    if (lastKey === 'f') return 'follow';
    return this._state;
  }

  private followCommand(gc: GameContext, ecs: EcsManager) {
    const agentId = this.getAgentIfClicked(gc, ecs);
    if (!agentId) return;

    const command = new FollowCommand();
    console.log("player issued follow");
    const nextCommand = this._commandService.getCommandResponse(command.commandName, { characterId: agentId });
    this._commandService.interrupt(gc.playerEnt.eid, ecs, 'Player issued new command', nextCommand);
  }

  private pickupCommand(gc: GameContext, ecs: EcsManager) {
    const clickGridSpace = this.getClickInWorldSpace(gc);
    if (!clickGridSpace) return;

    const command = new PickUpItemCommand();
    const itemIds: EntIdType[] = this._locationService.getIdsByLocation(clickGridSpace);
    const itemId = itemIds.find((v) => ecs.hasComponent(v, CItem));

    if (!itemId) return;
    console.log(`pickup ${itemId}`);
    const nextCommand = this._commandService.getCommandResponse(command.commandName, { itemId: itemId });
    this._commandService.interrupt(gc.playerEnt.eid, ecs, 'Player issued new command', nextCommand);
  }

  private goToComamnd(gc: GameContext, ecs: EcsManager) {
    const clickGridSpace = this.getClickInWorldSpace(gc);
    if (!clickGridSpace) return;

    const command = new GoToCommand();
    console.log("issue go to command");
    const nextCommand = this._commandService.getCommandResponse(command.commandName, { x: clickGridSpace.x, y: clickGridSpace.y });
    this._commandService.interrupt(gc.playerEnt.eid, ecs, 'Player issued new command', nextCommand);
  }

  private getAgentIfClicked(gc: GameContext, ecs: EcsManager): EntIdType | undefined {
    const clickGridSpace = this.getClickInWorldSpace(gc);
    if (!clickGridSpace) return;
    const eidsAtLoc = this._locationService.getIdsByLocation(clickGridSpace);
    for (const eid of eidsAtLoc) {
      if (ecs.hasComponent(eid, CAgent)) {
        return eid;
      }
    }
    return undefined;
  }

  private getClickInWorldSpace(gc: GameContext): Vec2 | null {
    if (!this._mouse.isMouseDown) return null;

    const invViewTranslation = new Vec2(-1 * gc.viewTransform.m13, -1 * gc.viewTransform.m23);
    const clickWorldSpace = gc.mouse.lastClick?.add(invViewTranslation);
    if (!clickWorldSpace) return null;

    const clickGridSpace = clickWorldSpace.mul(1.0 / CSprite.TILE_SIZE);
    clickGridSpace.x = Math.floor(clickGridSpace.x);
    clickGridSpace.y = Math.floor(clickGridSpace.y);
    return clickGridSpace;
  }

}
