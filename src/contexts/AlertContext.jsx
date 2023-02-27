import {useState} from "react";

const React = require('react');

export const AlertContext = React.createContext({});

export const AlertStyle = Object.freeze({
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
});

export const AlertContextProvider = ({children}) => {
  const [topAlert, setTopAlert] = useState({
    alertContent: null,
    alertStyle: null,
  });

  const setSuccess = (alertContent) => {
    // console.log(`[Alert Success]: ${alertContent}`)
    setTopAlert({
      alertContent,
      alertStyle: AlertStyle.SUCCESS,
    })
  }

  const setWarning = (alertContent) => {
    // console.log(`[Alert Warning]: ${alertContent}`)
    setTopAlert({
      alertContent,
      alertStyle: AlertStyle.WARNING,
    })
  }

  const setError = (alertContent) => {
    // console.log(`[Alert Error]: ${alertContent}`)
    setTopAlert({
      alertContent,
      alertStyle: AlertStyle.ERROR,
    })
  }

  const hideAlert = () => {
    setTopAlert({
      alertContent: null,
      alertStyle: null,
    })
  }

  return (
    <AlertContext.Provider value={{
      topAlert,
      setSuccess,
      setWarning,
      setError,
      hideAlert,
    }}>
      {children}
    </AlertContext.Provider>
  );
}
