const Telegraf = require("telegraf"); // import telegraf lib
const Markup = require("telegraf/markup"); // Get the markup module
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");

const Converter = require("./api/currency-converter"); // Currency converter code

const bot = new Telegraf(process.env.BOT_TOKEN); // Get the token from the environment variable
const URL = process.env.URL // get the Heroku URL for hosting
const PORT = process.env.PORT || 2000;

bot.telegram.setWebhook(`${URL}bot${BOT_TOKEN}`);
bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT);

// Start Bot
bot.start(ctx => {
  ctx.reply(
    `How can I help you, ${ctx.from.first_name}?`,
    Markup.inlineKeyboard([
      Markup.callbackButton("💱 Convert Currency", "CONVERT_CURRENCY"),
      Markup.callbackButton("🤑 View Rates", "VIEW_RATES")
    ]).extra()
  );
});

// Go back to menu after action
bot.action("BACK", ctx => {
  ctx.reply(`Glad I could help`);
  ctx.reply(
    `Do you need something else, ${ctx.from.first_name}?`,
    Markup.inlineKeyboard([
      Markup.callbackButton("💱 Convert Currency", "CONVERT_CURRENCY"),
      Markup.callbackButton("🤑 View Rates", "VIEW_RATES")
    ]).extra()
  );
});

// Currency converter Wizard
const currencyConverter = new WizardScene(
  "currency_converter",
  ctx => {
    ctx.reply("Please, type in the currency to convert from (example: USD)");
    return ctx.wizard.next();
  },
  ctx => {
    /* 
    * ctx.wizard.state is the state management object which is persistent
    * throughout the wizard 
    * we pass to it the previous user reply (supposed to be the source Currency ) 
    * which is retrieved through `ctx.message.text`
    */
    ctx.wizard.state.currencySource = ctx.message.text;
    ctx.reply(
      `Got it, you wish to convert from ${
        ctx.wizard.state.currencySource
      } to what currency? (example: EUR)`
    );
    // Go to the following scene
    return ctx.wizard.next();
  },
  ctx => {
    /*
    * we get currency to convert to from the last user's input
    * which is retrieved through `ctx.message.text`
    */
    ctx.wizard.state.currencyDestination = ctx.message.text;
    ctx.reply(
      `Enter the amount to convert from ${ctx.wizard.state.currencySource} to ${
        ctx.wizard.state.currencyDestination
      }`
    );
    return ctx.wizard.next();
  },
  ctx => {
    const amt = (ctx.wizard.state.amount = ctx.message.text);
    const source = ctx.wizard.state.currencySource;
    const dest = ctx.wizard.state.currencyDestination;
    const rates = Converter.getRate(source, dest);
    rates.then(res => {
      let newAmount = Object.values(res.data)[0] * amt;
      newAmount = newAmount.toFixed(3).toString();
      ctx.reply(
        `${amt} ${source} is worth \n${newAmount} ${dest}`,
        Markup.inlineKeyboard([
          Markup.callbackButton("🔙 Back to Menu", "BACK"),
          Markup.callbackButton(
            "💱 Convert Another Currency",
            "CONVERT_CURRENCY"
          )
        ]).extra()
      );
    });
    return ctx.scene.leave();
  }
);

// Scene registration
const stage = new Stage([currencyConverter], { default: "currency_converter" });
bot.use(session());
bot.use(stage.middleware());
bot.startPolling(); // Start polling bot from you computer
