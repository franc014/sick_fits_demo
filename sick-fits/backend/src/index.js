const cookieParser = require("cookie-parser");
require("dotenv").config({ path: "variables.env" });
const createServer = require("./createServer");
const db = require("./db");
const jwt = require("jsonwebtoken");

const server = createServer();

//  Use express middlware to handle cookies (JWT)
server.express.use(cookieParser());
// decode the jwt so we can get the userId on each request

//middlewares to register check user loggin on every request
server.express.use((req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    //could be no token if user is not logged in
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    //put the userId on onto req for further requests to access
    req.userId = userId;
  }
  next();
});

server.express.use(async (req, res, next) => {
  if (!req.userId) return next();

  const user = await db.query.user(
    { where: { id: req.userId } },
    "{id,permissions,name,email}"
  );

  req.user = user;
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL
    }
  },
  deets => {
    console.log(`Server is now running on port http:/localhost:${deets.port}`);
  }
);
