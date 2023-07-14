import React, { useState } from 'react';
import { PlayerConversationState } from '../../engine/ConversationState';
import { LoadingSpinner } from '../LoadingIndicator';
import '../../styles/components/Conversation.css';

export interface SendMessageProps {
  playerConversationState: PlayerConversationState;
}


const SendMessage: React.FC<SendMessageProps> = ({
  playerConversationState,
}) => {

  const [newMessage, setNewMessage] = useState('');

  const {waitingForResponse, isFinished} = playerConversationState;

  const handleNewMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(event.target.value);
  };

  const handleEndConversation = async () => {
    // const message = newMessage.trim() ?? `I'll be going now, goodbye.`;
    // playerConversationState.endConversation(message);
    playerConversationState.closeConversation();
  };

  const handleSendMessage = async () => {
    if (waitingForResponse) return;
    if (newMessage.trim() === '') {
      return;
    }

    setNewMessage('');
    playerConversationState.sendMessage(newMessage);
  };

  const handleEnterPressed = (event: any) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="conversation__input">
        <textarea
          placeholder="Type a message... press enter to send"
          value={newMessage}
          onChange={handleNewMessageChange}
          onKeyDown={handleEnterPressed}
          disabled={!!isFinished}
        />
        {waitingForResponse 
          ? <LoadingSpinner />
          : <div className="conversation__buttons">
            {!isFinished ? <button onClick={handleSendMessage}>Send</button> : undefined}
            <button onClick={handleEndConversation}>Close</button>
          </div>
        }
      </div>
  );
};

export default SendMessage;