import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Web3Button } from "@web3modal/react";

import Capitalize from "../custom/Capitalize";
import { NotificationManager } from "../../common/react-notifications";

import styles from "./styles.module.scss";

const Header = (_props) => {
  const dispatch = useDispatch();
  const currentAccount = useSelector((state) => state.account);
  const notification = useSelector((state) => state.ui.notification);
  const network = useSelector((state) => state.network);
  const lang = useSelector((state) => state.language.header);
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    if (notification) {
      const { type, title, message } = notification;
      const args = [message, title, 5000, null, null, "filled"];

      switch (type) {
        case "success":
          NotificationManager.success(...args);
          break;
        case "error":
          NotificationManager.error(...args);
          break;
        default:
          break;
      }

      dispatch({ type: "CLEAR_NOTIFICATION" });
    }
  }, [notification, dispatch]);

  return (
    <Navbar
      sticky="top"
      variant="dark"
      expand="lg"
      className={styles.header}
      style={{
        backgroundColor: theme.headerBackground,
        color: theme.headerForeground,
      }}
    >
      <Container>
        <Navbar.Brand>
          <Nav.Link as={Link} to="/">
            <img width="200" alt="" src="/images/sos_logo.svg" />
          </Nav.Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse
          className={styles.collapse}
          variant="dark"
          id="basic-navbar-nav"
        >
          <Nav className="mr-auto">
            <>
              <Nav.Link className={styles.headerLink} as={Link} to="/">
                {lang.home}
              </Nav.Link>
              <Nav.Link className={styles.headerLink} as={Link} to="/funds">
                {lang.funds}
              </Nav.Link>
              {currentAccount.account ? (
                <Nav.Link className={styles.headerLink} as={Link} to="/profile">
                  {lang.profile}
                </Nav.Link>
              ) : null}
              {currentAccount.hasCreatorRole ? (
                <Nav.Link className={styles.headerLink} as={Link} to="/manage">
                  {lang.manage}
                </Nav.Link>
              ) : null}
            </>
          </Nav>
          <Nav className={styles.rightNav}>
            {network.name ? (
              <div className="tw-my-8 md:tw-my-0 tw-mr-4 tw-text-xs">
                <Capitalize string={network.name} />
              </div>
            ) : null}
            <Web3Button />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
