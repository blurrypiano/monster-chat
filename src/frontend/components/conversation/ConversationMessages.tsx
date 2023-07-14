import React, { useEffect, useRef, useState } from 'react';
import '../../styles/components/Conversation.css';
import { IConversationModel, ResponseActionType } from '../../../backend/interfaces/IConversationService';
import { GameState } from '../Game';
import LoadingIndicator, { LoadingSpinner } from '../LoadingIndicator';
import ConversationService from '../../../backend/services/ConversationService';
import CAgent from '../../engine/comps/CAgent';
import locationData, { locationContext } from '../../../data/locationData';
import LocationService from '../../engine/services/LocationService';
import { townLocation } from '../../../assets/collision/townLocation';
import CGridCollider from '../../engine/comps/CGridCollider';
import npcData from '../../../data/npcs/NpcData';
import CSprite from '../../engine/comps/CSprite';
import ConversationState from '../../engine/ConversationState';

export interface ConversationMessagesProps {
  conversationState: ConversationState;
}

const ConversationMessages: React.FC<ConversationMessagesProps> = ( {
  conversationState
}) => {
  const messages = conversationState.messages;
  const messagesDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messagesDivRef.current) return;
      messagesDivRef.current.scrollTop = messagesDivRef.current.scrollHeight;
  }, [messages.length]);

  return (
    <div className="conversation__messages" ref={messagesDivRef}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`conversation__bubble conversation__bubble--${message.sender}`}
        >
          {message.text}
        </div>
      ))}
    </div>
      /* <div className="conversation__input">
        <textarea
          placeholder="Type a message... press enter to send"
          value={newMessage}
          onChange={handleNewMessageChange}
          onKeyDown={handleEnterPressed}
          disabled={!!conversationOverEndState}
        />
        {messageLoading 
          ? 
            <LoadingSpinner />
          : <div className="conversation__buttons">
            {!conversationOverEndState ? <button onClick={handleSendMessage}>Send</button> : undefined}
            <button onClick={handleEndConversation}>Leave</button>
          </div>
        }
      </div> */
  );
};

export default ConversationMessages;