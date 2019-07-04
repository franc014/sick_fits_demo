const { forwardTo } = require("prisma-binding");
const { hasPermission } = require("../utils");

const Query = {
  /* async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    return items;
  } */
  items: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  item: forwardTo("db"),
  me(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      console.log("nop!");
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
  },
  users(parent, args, ctx, info) {
    //1. check if user is logged in
    if (!ctx.request.userId) {
      throw new Error("You are not logged in to do this!");
    }
    //2. check if user has enough permissions to fetch list of users
    //user registered in express middleware-index.js
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"]);
    //3. return users
    return ctx.db.query.users({}, info);
  },
  async order(parent, args, ctx, info) {
    // 1. Make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error("You arent logged in!");
    }
    // 2. Query the current order
    const order = await ctx.db.query.order(
      {
        where: { id: args.id }
      },
      info
    );
    // 3. Check if the have the permissions to see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      "ADMIN"
    );
    if (!ownsOrder && !hasPermissionToSeeOrder) {
      throw new Error("You cant see this buddd");
    }
    // 4. Return the order
    return order;
  },
  async orders(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You arent logged in!");
    }

    const users = await ctx.db.query.orders(
      {
        where: {
          user: { id: ctx.request.userId }
        }
      },
      info
    );

    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      "ADMIN"
    );

    if (!hasPermissionToSeeOrder) {
      throw new Error("You cant see this buddd");
    }

    return users;
  }
};

module.exports = Query;
