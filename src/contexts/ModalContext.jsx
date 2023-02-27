import {useState} from "react";

const React = require('react');

export const ModalContext = React.createContext({});

export const ModalContextProvider = ({children}) => {
  const [modal, setModal] = useState({
    modalName: null,
    modalOptions: null,
  });

  return (
    <ModalContext.Provider value={{
      modal,
      setModal,
    }}>
      {children}
    </ModalContext.Provider>
  );
}
