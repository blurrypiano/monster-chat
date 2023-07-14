import BoundedBox from "../../infra/BoundedBox";
import EcsManager, { EntIdType, EntsWith } from "../../infra/Ecs";
import { Vec2 } from "../../infra/LinAlg";
import CAgent from "../comps/CAgent";
import CClickable from "../comps/CClickable";
import { CInventory } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import CTransform from "../comps/CTransform";
import GameContext from "../GameContext";
import ConversationService from "../services/ConversationService";
import PlayerInventoryService from "../services/PlayerInventoryService";

type CompOrder = [CSprite, CClickable, CTransform];
const constructors = [CSprite, CClickable, CTransform];

export default class MousePickerSystem {

  private _selectedEids: EntIdType[] = [];
  
  constructor(
    private readonly _playerInventoryService: PlayerInventoryService,
    private readonly _conversationService: ConversationService,
  ) {

  }

  public run(gc: GameContext, ecs: EcsManager): void {

    const invViewTranslation = new Vec2(-1 * gc.viewTransform.m13, -1 * gc.viewTransform.m23);
    const clickWorldSpace = gc.mouse.lastClick?.add(invViewTranslation);
    gc.mouse.clearLastClick();

    const ents: EntsWith<CompOrder> = ecs.getEntsWith(...constructors);

    if (!clickWorldSpace) return;

    if (!gc.mouse.isCtrlDown) {
      this._selectedEids = [];
    }

    // get clickable sprites
    let selectedAgentId: EntIdType | undefined = undefined;
    for (const [eid, [sprite, clickable, transform]] of ents) {
      const bb = BoundedBox.forSpriteTransform(sprite, transform);
      if (bb.contains(clickWorldSpace.x, clickWorldSpace.y)) {
        clickable.isSelected = true;
        console.log(eid, ecs.debugEnt(eid));
        if (this._selectedEids.findIndex((v) => v === eid) < 0) {
          this._selectedEids.push(eid);
        }
      } else {
        clickable.isSelected = false;
      }
      if (clickable.isSelected && ecs.getComponent(eid, CInventory)) {
        selectedAgentId = eid;
      }
    }

    console.log(`Selected: ${selectedAgentId}`);
    const otherAgentId = selectedAgentId !== gc.playerEnt.eid ? selectedAgentId : undefined;
    this._playerInventoryService.selectInventoryContext(ecs, gc.playerEnt.eid, otherAgentId);
    if (this._selectedEids.length === 2) {
      this.showConversationIfAgents(gc, ecs, this._selectedEids[0], this._selectedEids[1]);
    } else if (selectedAgentId && selectedAgentId !== gc.playerEnt.eid && ecs.hasComponent(selectedAgentId, CAgent)) {
      this._conversationService.setActiveConversation(gc, ecs, gc.playerEnt.eid, selectedAgentId);
    } 
  }

  private showConversationIfAgents(gc: GameContext, ecs: EcsManager, agent: EntIdType, otherAgent: EntIdType) {
    if (ecs.hasComponent(agent, CAgent) && ecs.hasComponent(otherAgent, CAgent)) {
      this._conversationService.setActiveConversation(gc, ecs, agent, otherAgent);
      console.log('set active conversation?');
    }
  }
}
