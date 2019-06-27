import React, { Component } from "react";
import formatMoney from "../lib/formatMoney";
import styled from "styled-components";
import PropTypes from "prop-types";
import RemoveFromCart from "./RemoveFromCart";
const CartItemsStyles = styled.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightgrey};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  img {
    margin-right: 10px;
  }
  h3,
  p {
    margin: 0;
  }
`;

class CartItem extends Component {
  render() {
    const { cartItem } = this.props;

    const item = cartItem.item;

    if (!item)
      return (
        <CartItemsStyles>
          <p>this item has been removed</p>
          <RemoveFromCart id={cartItem.id} />
        </CartItemsStyles>
      );

    return (
      <CartItemsStyles>
        <img width="100" src={item.image} alt={item.title} />
        <div className="cart-item-details">
          <h3>{item.title}</h3>
          <p>
            {formatMoney(item.price * cartItem.quantity)}
            {" - "}
            <em>
              {cartItem.quantity} &times; {formatMoney(item.price)} each
            </em>
          </p>
        </div>
        <RemoveFromCart id={cartItem.id} />
      </CartItemsStyles>
    );
  }
}

CartItem.propTypes = {
  cartItem: PropTypes.object.isRequired
};

export default CartItem;
