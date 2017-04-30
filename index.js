'use strict';

const Koa = require('koa');
const app = new Koa();
const hbs = require('koa-hbs');
const serve = require('koa-static');
const logger = require('koa-logger');
const session = require('koa-session')

const bodyparser = require('koa-bodyparser');
const soap = require('soap');
const parseString = require('xml2js').parseString;
const js2xmlparser = require('js2xmlparser');

const shipcompliant = require('./shipcompliantmethods');
const router = require('./router');

// ERROR HANDLER
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      status: 500,
      data: 'Internal Server Error',
    };
    console.error(e);
  }
});

// LOGGER
app.use(logger());

//CONNECT DBs
// start postgres client
const postgres = require('./lib/postgres');
// start redis client
const redis = require('./lib/redis');
// add middleware

app.keys = [process.env.SESSION_KEY]
app.use(postgres.middleware);
app.use(redis.middleware);
//VIEW
app.use(hbs.middleware({
  viewPath: `${__dirname}/views`,
  partialsPath: `${__dirname}/views/partials`,
  layoutsPath: `${__dirname}/views/layouts`,
  defaultLayout: `main`,
}));

// MIDDLEWARE
app.use(bodyparser());
app.use(session({}, app))
app.use(serve('public'));

// Add ctx.respond function
app.use(async (ctx, next) => {
  ctx.respond = (status, data) => {
    status = Number(status);
    ctx.status = status;
    ctx.body = {
      status,
      data,
      success: status >= 200 && status <= 299,
    };
  };
  await next();
});

// ROUTING
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT, function () {
  console.log(`Listening on port ${process.env.PORT}...`);
});
