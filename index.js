const Telegraf = require("telegraf"); // import telegraf lib
const Markup = require("telegraf/markup"); // Get the markup module
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");
const { enter, leave } = Stage
const Converter = require("./api/currency-converter"); // Currency converter code

const bot = new Telegraf(process.env.BOT_TOKEN); // Get the token from the environment variable

const URL = process.env.URL; // get the Heroku config var URL
const BOT_TOKEN = process.env.BOT_TOKEN || ""; // get Heroku config var BOT_TOKEN
const PORT = process.env.PORT || 2000;

// Config the webhook for heroku
bot.telegram.setWebhook(`${URL}bot${BOT_TOKEN}`);
bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT);

// Start Bot
bot.start(ctx => {
  ctx.reply(
    `How can I help you, ${ctx.from.first_name}?`,
    Markup.inlineKeyboard([
      Markup.callbackButton("💱 Convert Currency", "CONVERT_CURRENCY")
    ]).extra()
  );
});

// Stop current action
bot.command("stop", ctx => {
  ctx.reply(
    `Ok boss!`
  );
  return currencyConverter.leave()
});

// Get about bot
bot.command("about", ctx => {
  ctx.reply(
    `Did you know I was created by a tutorial?

Check out how I was made 👇😀
https://chatbotslife.com/build-a-simple-telegram-currency-converter-bot-with-node-js-84d15b10597c`
  );
  return currencyConverter.leave()
});




// Go back to menu after action
bot.action("BACK", ctx => {
  ctx.reply(
    `Do you need something else, ${ctx.from.first_name}?`,
    Markup.inlineKeyboard([
      Markup.callbackButton("💱 Convert Currency", "CONVERT_CURRENCY")
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
    ctx.reply(
      `Okay let's see this...`,
    );
    const amt = (ctx.wizard.state.amount = ctx.message.text);
    const source = ctx.wizard.state.currencySource;
    const dest = ctx.wizard.state.currencyDestination;
    const rates = Converter.getRate(source, dest);
    rates.then(res => {
      let newAmount = Object.values(res.data)[0] * amt;
      newAmount = newAmount.toFixed(3).toString();
      console.log(newAmount);

      if (newAmount === "NaN") {
        ctx.reply(
          `Hmmm... weird, I can't convert this, check through your currency inputs`,
          Markup.inlineKeyboard([
            Markup.callbackButton("🔙 Back to Menu", "BACK"),
            Markup.callbackButton("💱 Convert Again", "CONVERT_CURRENCY")
          ]).extra()
        );
        
      } else
        ctx.reply(
          `${amt} ${source} is worth \n${newAmount} ${dest}`,
          Markup.inlineKeyboard([
            Markup.callbackButton("🔙 Back to Menu", "BACK"),
            Markup.callbackButton("💱 Convert Again", "CONVERT_CURRENCY")
          ]).extra()
        );
    });

    return ctx.scene.leave();
  }
);

// Scene registration
const stage = new Stage([currencyConverter], {ttl: 300});
bot.use(session());
bot.use(stage.middleware());

// Start convert action
bot.command("convert",  enter("currency_converter"));
bot.action("CONVERT_CURRENCY",  enter("currency_converter"));

// Matching any input and default known inputs
bot.hears("Hello",({reply}) => reply('Hello! What\'s up?'))
bot.hears("Hi",({reply}) => reply('Hello! What\'s up?'))

bot.hears(/.*/, ({ match, reply }) => reply(`I really wish i could understand what "${match}" means

As for now you can use /convert to make me convert currencies`));
