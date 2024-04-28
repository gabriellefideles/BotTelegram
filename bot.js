const { Telegraf, Scenes, session } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const prisma = new PrismaClient();

const isBusinessHours = () => {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 9 && hours < 18; // Alteração: corrigido o intervalo de horas para estar dentro do horário comercial
};

const handleMessage = async (ctx) => {
  if (isBusinessHours()) {
    ctx.reply('Olá! Você pode encontrar mais informações em: https://faesa.br');
  } else {
    ctx.reply('Desculpe, estamos fora do horário comercial (09:00 às 18:00). Por favor, deixe seu e-mail para entrarmos em contato.');
    ctx.session.email = null;
    ctx.scene.enter('email');
  }
};

const emailScene = new Scenes.BaseScene('email'); // Alteração: usando BaseScene para criar a cena

emailScene.on('text', async (ctx) => {
  const email = ctx.message.text.trim();
  if (email.includes('@')) {
    await prisma.email.create({ data: { email } });
    ctx.reply('Obrigado! Entraremos em contato assim que possível.');
    ctx.scene.leave();
  } else {
    ctx.reply('Por favor, forneça um endereço de e-mail válido.');
  }
});

const stage = new Scenes.Stage([emailScene]); // Alteração: criando um Stage e passando a cena

bot.use(session());
bot.use(stage.middleware()); // Alteração: adicionando o middleware do Stage

bot.start(handleMessage);
bot.help(handleMessage);
bot.on('text', handleMessage);

bot.launch();
console.log('Bot started');
