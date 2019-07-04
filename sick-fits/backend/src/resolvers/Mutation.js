const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");
const { hasPermission } = require("../utils");
const stripe = require("../stripe");

const mutations = {
  async createItem(parent, args, ctx, info) {
    // todo check if they are logged in

    if (!ctx.request.userId) {
      throw new Error("You must logged in to do that");
    }

    const item = await ctx.db.mutation.createItem(
      {
        /* data:{
          title:args.title,
          description:args.description
        } */

        data: {
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
          ...args
        } // using spread operator to fetch object data, instead of one by one as above
      },
      info
    );
    return item;
  },
  async updateItem(parent, args, ctx, info) {
    const updates = { ...args };
    delete updates.id;
    const item = await ctx.db.mutation.updateItem(
      {
        data: updates,
        where: { id: args.id }
      },
      info
    );

    return item;
  },
  async deleteItem(parent, args, ctx, info) {
    console.log(info);
    const where = {
      id: args.id
    };
    //find the item
    const item = await ctx.db.query.item(
      {
        where
      },
      `{id title user{id}}`
    );

    // 2. Check if they own that item, or have the permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );

    if (!ownsItem && !hasPermissions) {
      throw new Error("You don't have permission to do that!");
    }

    //delete it

    return ctx.db.mutation.deleteItem(
      {
        where
      },
      info
    );
  },

  async signUp(parent, args, ctx, info) {
    //lowercase email
    args.email = args.email.toLowerCase();
    //hash password
    password = await bcrypt.hash(args.password, 10);
    //create user in db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args, //just spread args values
          password, //modify just passord
          permissions: { set: ["USER"] }
        }
      },
      info
    );

    //create a json web token(jwt) for the user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //we set the jwt as a cookie in the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 //1 year cookie
    });

    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    const user = await ctx.db.query.user({
      where: {
        email
      }
    });

    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new Error(`The password is invalid`);
    }

    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });

    return user;
  },

  async signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Bye!" };
  },

  async requestReset(parent, args, ctx, info) {
    //1. check if user exists
    const user = await ctx.db.query.user({
      where: {
        email: args.email
      }
    });

    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }

    //2. generate reset token and expiry on a user
    const randomBytesPromisefied = promisify(randomBytes);
    const resetToken = (await randomBytesPromisefied(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; //1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: {
        email: args.email
      },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    //3.send email
    const mailRes = await transport.sendMail({
      from: "jfandradea@gmail.com",
      to: user.email,
      subject: "Your password reset token",
      html: makeANiceEmail(
        `Your password reset token is here: 
        \n\n ${resetToken}
        <a href="${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}">Click here to reset</a>`
      )
    });

    //4. return message
    return {
      message: "tanks"
    };
  },
  async resetPassword(parent, args, ctx, info) {
    //1. check if passwords match
    if (args.password != args.confirmPassword) {
      throw new Error(`passwords don't match`);
    }
    //2. check if it's a legit reset token
    //3. check if it's expired
    //grab the first user
    console.log("user res", args.resetToken);

    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });

    if (!user) {
      throw new Error(`This token is either invalid or expired`);
    }
    //4. hash new password
    const password = await bcrypt.hash(args.password, 10);
    //5. save new password and remove old fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: {
        email: user.email
      },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    //6. generate the jwt
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. generate the jwt cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });

    //8. return the new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    console.log(args);
    // 1. Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in!");
    }
    // 2. Query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId
        }
      },
      info
    );

    // 3. Check if they have permissions to do this
    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);

    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: {
          id: args.userId
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    //1. make sure the user is signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be signed in sooon");
    }

    //2. query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    //3. check if that item is already in their cart
    if (existingCartItem) {
      console.log("this item is already in their cart");
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + 1
        }
      });
    }
    //and  increment by one if it is
    //4. if it's not in the cart, create a fresh cart item for that user
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId }
        },
        item: {
          connect: { id: args.id }
        }
      }
    });
  },
  async removeFromCart(parent, args, ctx, info) {
    //1. find the cart item
    const cartItem = await ctx.db.query.cartItem(
      { where: { id: args.id } },
      `{id,user {id}}`
    );

    if (!cartItem) {
      throw new Error("No cart item found");
    }
    //2. make sure they own the cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error("You can not remove this item");
    }
    //3. delete that cart item
    return ctx.db.mutation.deleteCartItem({ where: { id: args.id } }, info);
  },

  async createOrder(parent, args, ctx, info) {
    // 1. Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId)
      throw new Error("You must be signed in to complete this order.");
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      name
      email
      cart {
        id
        quantity
        item { title price id description image largeImage }
      }}`
    );
    // 2. recalculate the total for the price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    console.log(`Going to charge for a total of ${amount}`);
    // 3. Create the stripe charge (turn token into $$$)
    const charge = await stripe.charges.create({
      amount,
      currency: "USD",
      source: args.token
    });
    // 4. Convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        title: cartItem.item.title,
        description: cartItem.item.description,
        price: cartItem.item.price,
        quantity: cartItem.quantity,
        image: cartItem.item.image,
        largeImage: cartItem.item.largeImage,
        user: { connect: { id: user.id } }
      };
      return orderItem;
    });

    /*   const orderItemsFetched = await Promise.all(orderItems);
    console.log(orderItemsFetched, "orders");
 */
    // 5. create the Order

    const order = await ctx.db.mutation.createOrder(
      {
        data: {
          items: { create: orderItems },
          total: charge.amount,
          user: { connect: { id: user.id } },
          charge: charge.id
        }
      },
      info
    );

    // 6. Clean up - clear the users cart, delete cartItems
    /* user.cart.map(cartItem => {
      ctx.db.mutation.deleteCartItem(
        {
          where: { id: cartItem.id }
        },
        info
      );
    }); */

    const cartItemIds = user.cart.map(cartItem => cartItem.id);

    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds
      }
    });

    /* ctx.db.mutation.updateUser({
      data: {
        cart: { set: [] }
      },
      where: { id: user.id }
    }); */

    // 7. Return the Order to the client
    return order;
  }
};

module.exports = mutations;
