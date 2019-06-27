import React, { Component } from "react";
import OrdersList from "../components/OrdersList";
import PleaseSignIn from "../components/PleaseSignIn";

class orders extends Component {
  render() {
    return (
      <div>
        <PleaseSignIn>
          <OrdersList />
        </PleaseSignIn>
      </div>
    );
  }
}

export default orders;
