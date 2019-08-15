import React, { Component } from "react";
import FeedbackItem from "./FeedbackItem";
import { closeFeedback } from "../../services/http/feedbackService";
import classNames from "classnames";
export default class FeedbackList extends Component {
  state = {};

  onCloseFeedback = feedbackId => {
    closeFeedback(feedbackId)
      .then(res => this.onCloseFeedbackSuccess(res.result, feedbackId))
      .catch(err => this.onCloseFeedbackError(err));
  };

  onCloseFeedbackSuccess = (res, feedbackId) => {
    this.props.feedbackClosed(feedbackId);
  };

  onCloseFeedbackError = err => {
    alert(err);
    window.location.reload();
  };

  renderFeedback = (feedback, index) => {
    const messages = feedback.Messages;
    return (
      <FeedbackItem
        key={feedback.id}
        id={feedback.id}
        createdAt={feedback.createdAt}
        message={messages[messages.length - 1].text}
        isClosed={feedback.isClosed}
        onCloseFeedback={this.onCloseFeedback}
        userSeenAt={feedback.anonymLastSeenAt}
      />
    );
  };

  onPageChange = e => {
    let currentUrlParams = new URLSearchParams(window.location.search);
    currentUrlParams.set("page", e.target.id);
    this.props.history.push(
      window.location.pathname + "?" + currentUrlParams.toString()
    );
    this.props.onPageChange(e.target.id);
  };

  render() {
    const { feedbacks, totalPages, currentPage } = this.props;
    return (
      <div className="feedbacks-container">
        <div className="page">
          <div className="pagination">
            {totalPages.map(number => (
              <li
                className={classNames(
                  "number",
                  currentPage == number ? "selected" : ""
                )}
                key={number}
                id={number}
                onClick={this.onPageChange}
              >
                {number}
              </li>
            ))}
          </div>
          <div>
            <div
              className="feedback-item-container info"
              onClick={this.onFeedback}
            >
              <div className="text created-at">Feedback Created</div>
              <div className="text user-seen-at">User last seen</div>
              <div className="text message">First message</div>
              <div className="text closed">
                <div className="text-center">Ticket Closed</div>
              </div>
            </div>
            {feedbacks.map((item, index) => this.renderFeedback(item, index))}
          </div>
        </div>
      </div>
    );
  }
}
