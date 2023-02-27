import "./Alerts.css";
import {Component} from "react";
import {AlertStyle} from "../../contexts/AlertContext";
const {AlertContext} = require("../../contexts/AlertContext");
const React = require('react');

const ALERT_DISPLAY_DURATION_MS = 5000;

export class MainAlert extends Component {
  static contextType = AlertContext

  componentDidMount() {
    this.hideAlertTimeout = setTimeout(this.hideAlert, ALERT_DISPLAY_DURATION_MS)
  }

  componentWillUnmount() {
    if (this.hideAlertTimeout) {
      this.hideAlert()
      clearTimeout(this.hideAlertTimeout)
    }
  }

  hideAlert = () => {
    this.hideAlertTimeout = null;
    this.context.hideAlert()
  }

  render() {
    const {alertContent, alertStyle} = this.context.topAlert;
    if (!alertContent) {
      return null;
    }

    const errorClassName = alertStyle === AlertStyle.ERROR ? " error" : ""
    return (
      <div className={`container flexRow alertContainer${errorClassName}`}>
        <div className="alertContent">{alertContent}
          {/*&nbsp;<div className="alertLink" onClick={() => {}}>*/}
          {/*  this is a link*/}
          {/*</div>*/}
        </div>
      </div>
    );
  }
}
