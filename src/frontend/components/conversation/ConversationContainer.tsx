import React from 'react';
import '../../styles/components/Conversation.css';
import ConversationState from '../../engine/ConversationState';
import ConversationMessages from './ConversationMessages';
import LoadingIndicator from '../LoadingIndicator';
import SendMessage from './SendMessage';

export interface ConversationContainerProps {
  maxHeight?: number;
  minHeight?: number;
  conversationState?: ConversationState;
}

const ConversationContainer: React.FC<ConversationContainerProps> = ({  
  maxHeight,
  minHeight,
  conversationState,
}) => {
  // const conversationState = props.conversationState;
  const dimensionStyle: any = {};
  // if (props?.maxHeight) dimensionStyle.maxHeight = props.maxHeight;
  if (maxHeight) dimensionStyle.height = maxHeight;

  // if (!conversationState) {
  //   return <div className="conversation loading-indicator-container" style={dimensionStyle}>
  //       <LoadingIndicator />
  //   </div>
  // }

  const playerConversationState = conversationState?.playerConversationState;

  return (
    <div className="conversation" style={dimensionStyle}>
      {conversationState && <ConversationMessages conversationState={conversationState} />}
      {playerConversationState && <SendMessage playerConversationState={playerConversationState} />}
    </div>
  );
};

export default ConversationContainer;