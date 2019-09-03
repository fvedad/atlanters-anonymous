import dateformat from "dateformat";
import PropTypes from "prop-types";
import React, { Component } from "react";
import send from "../../assets/images/feedback/send.png";
import { ANONYMOUS_LAST_SEEN, USER_LAST_SEEN } from "../../constants/strings";
import { DEFAULT_USERNAME, DEFAULT_USER_ID } from "../../constants/user";
import { getCurrentUser } from "../../services/http/authService";
import {
  postFeedbackMessage,
  updateSeenAt
} from "../../services/http/feedbackService";
import { connectSocket } from "../../services/socket/base";
import {
  emitMessage,
  emitSeen,
  onErrorReceived,
  onMessageReceived,
  onSeen
} from "../../services/socket/chat";
import { validateInputMessage } from "../../utils/strings";
import { ANONYMOUS_USER } from "../../utils/user";
import TicketMessage from "./TicketMessage";

export default class FeedbackTicket extends Component {
  static propTypes = {
    /**
     * Feedback info returned from server after it is initially created
     */
    feedback: PropTypes.shape({
      id: PropTypes.string,
      isClosed: PropTypes.bool
    }),

    /**
     * Messages related to specific feedback
     */
    messages: PropTypes.array.isRequired
  };

  state = {
    messages: [],
    inputMessage: "",
    latestAuthorName: "",
    user: {
      name: "",
      id: ""
    },
    isMessageSubmitting: false,
    seen: false,
    /**
     * Checks if this client is the author of received chat message
     */
    isAuthorCurrentClient: false,
    error: ""
  };

  resolveCurrentUser = () => {
    return getCurrentUser() ? getCurrentUser() : ANONYMOUS_USER;
  };

  resolveAuthorName = message => {
    return message.User ? message.User.name : ANONYMOUS_USER.name;
  };

  /**
   * Scroll to bottom of chat container
   */
  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView();
  };

  /**
   * Called when server emits a message through socket
   *
   * @param {Object} data corresponds to message model from the server
   */
  onChatMessageReceived = data => {
    const { messages, user } = this.state;
    if (!this.state.isAuthorCurrentClient) {
      messages.push(data);
      const latestAuthorName = this.resolveAuthorName(data);
      this.setState({
        messages,
        isMessageSubmitting: false,
        seen: false,
        latestAuthorName
      });
    }
  };

  /**
   * Called when server emits an error through socket
   *
   * @param {String} error error message
   */
  onChatErrorReceived = error => {
    this.state.socket.disconnect();
    this.setState({ isMessageSubmitting: false });
  };

  /**
   * Called when seen is transmitted
   */
  onSeenReceived = ({ user, date }) => {
    const currentUser = this.resolveCurrentUser();
    const { latestAuthorName } = this.state;
    if (
      user.name !== currentUser.name &&
      latestAuthorName === currentUser.name
    ) {
      this.setState({ seen: true });
    }
  };

  /**
   * If error occured in a socket
   * @param {Object} err
   */
  onEmitSeenError(err) {
    this.state.socket.disconnect();
  }

  /**
   * Returns true if latest message was seen by user on opposite end, and
   * if current user is author of latest message
   *
   * @param {String} messageCreatedAt when message was created
   * @param {String} latestAuthorName author of latest message
   * @param {String} feedbackSeenAt when user on opposite end had seen the message
   * @param {String} currentUser represents if current client is anonymous or logged in
   */
  isSeen = (
    messageCreatedAt,
    latestAuthorName,
    feedbackSeenAt,
    currentUser
  ) => {
    if (
      new Date(feedbackSeenAt) >= new Date(messageCreatedAt) &&
      latestAuthorName === currentUser
    ) {
      return true;
    }
    return false;
  };

  updateMountState = (socket, user, { feedback, messages }) => {
    const lastMessage = messages[messages.length - 1];
    const latestAuthorName = this.resolveAuthorName(lastMessage);
    this.setState({
      user,
      messages,
      latestAuthorName,
      seen: this.isSeen(
        lastMessage.createdAt,
        latestAuthorName,
        user.name !== DEFAULT_USERNAME
          ? feedback.anonymLastSeenAt
          : feedback.userLastSeenAt,
        user.name
      ),
      socket,
      error: ""
    });
  };

  componentDidMount() {
    this.scrollToBottom();
    const socket = connectSocket();
    const user = this.resolveCurrentUser();
    const { feedback } = this.props;
    this.updateMountState(socket, user, this.props);
    onMessageReceived(feedback.id, this.onChatMessageReceived);
    onErrorReceived(user ? user.id : DEFAULT_USER_ID, this.onChatErrorReceived);
    onSeen(feedback.id, this.onSeenReceived);
    this.updateSeenInfo();
    window.addEventListener("focus", this.onFocus);
  }

  updateSeenInfo = () => {
    const user = this.resolveCurrentUser();
    const { id } = this.props.feedback;
    const date = new Date();
    const payload = {
      [user.name !== DEFAULT_USERNAME
        ? USER_LAST_SEEN
        : ANONYMOUS_LAST_SEEN]: date
    };
    updateSeenAt(id, payload)
      .catch(err => this.onUpdateSeenError(err))
      .then(res => this.onUpdateSeenSuccess(res.result, user, id, date))
      .catch(err => this.onEmitSeenError(err));
  };

  componentDidUpdate() {
    this.scrollToBottom();
  }

  componentWillUnmount() {
    window.removeEventListener("focus", this.onFocus);
  }

  onFocus = () => {
    this.updateSeenInfo();
  };

  onUpdateSeenSuccess(res, user, feedbackId, date) {
    emitSeen(user, feedbackId, date);
  }

  /**
   * If error occured during REST call
   * @param {Object} err
   */
  onUpdateSeenError(err) {
    if (err.message.includes("Failed to fetch")) {
      return;
    }
    this.setState({ error: err.message });
  }

  onSendMessage = e => {
    e.preventDefault();
    const { inputMessage, user } = this.state;
    if (inputMessage === "") return;
    const error = validateInputMessage(inputMessage);
    if (error) {
      this.setState({ error });
      return;
    }
    const { id } = this.props.feedback;
    this.setState({ isMessageSubmitting: true });
    postFeedbackMessage(id, user.id === DEFAULT_USER_ID ? "" : user.id, {
      text: inputMessage
    })
      .then(res => this.onPostFeedbackMessageSuccess(res.result))
      .catch(err => this.onPostFeedbackMessageError(err));
  };

  onPostFeedbackMessageSuccess = res => {
    const { messages } = this.state;
    if (res.User == null) res.User = ANONYMOUS_USER;
    messages.push(res);
    const lastMessage = messages[messages.length - 1];
    const latestAuthorName = this.resolveAuthorName(lastMessage);
    this.setState({
      messages,
      isMessageSubmitting: false,
      isAuthorCurrentClient: true,
      seen: false,
      latestAuthorName,
      inputMessage: ""
    });
    emitMessage(this.props.feedback.id, res);
  };

  onPostFeedbackMessageError = err => {
    this.setState({ error: err.message, isMessageSubmitting: false });
  };

  render() {
    const {
      inputMessage,
      messages,
      seen,
      isMessageSubmitting,
      error
    } = this.state;
    const { feedback } = this.props;
    return (
      <div className="form feedback-card">
        <div className="ticket-title text-center">
          Created at: {dateformat(feedback.createdAt, "dd.mm.yyyy. HH:MM")}
        </div>
        <hr />
        <div className="messages-container">
          {messages.map((item, index) => (
            <TicketMessage
              key={index}
              totalMessages={messages.length}
              index={index}
              text={item.text}
              info={item.info}
              userName={item.User ? item.User.name : DEFAULT_USERNAME}
              seen={seen}
            />
          ))}
          <div
            className="bottom-message"
            ref={el => {
              this.messagesEnd = el;
            }}
          >
            {error}
          </div>
        </div>
        <form
          className="submit-message-container"
          onSubmit={this.onSendMessage}
        >
          <input
            className="input"
            type="text"
            value={feedback.isClosed ? "This ticket is closed" : inputMessage}
            disabled={feedback.isClosed || isMessageSubmitting}
            placeholder="Type a message..."
            onChange={e => this.setState({ inputMessage: e.target.value })}
          />
          <input
            className="image"
            type="image"
            name="submit"
            border="0"
            alt="Submit"
            disabled={isMessageSubmitting}
            src={send}
          />
        </form>
      </div>
    );
  }
}
