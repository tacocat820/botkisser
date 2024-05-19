
import config from './config.json' assert { type: 'json' };

async function query(data) {
    try{
      const response = await fetch(
        "https://api-inference.huggingface.co/models/Bootcat/bk-delta-psi",
        {
          headers: { Authorization: `Bearer ${config.hf_token}` },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      return result;
    } catch(err){
      return {"error": "Модель грузится"};
    }
  }
  
  function truncateText(text, maxLen) {
    if (text.length <= maxLen) {
      return text;
    } else {
      return text.slice(0, maxLen) + "...";
    }
  }
  
  function jsonExtract(jsonString, key) {
    try {
      const parsedJson = JSON.parse(jsonString);
      if (key in parsedJson) {
        return parsedJson[key];
      } else {
        return '';
      }
    } catch (error) {
      return 'Invalid JSON';
    }
  }
  
  function getTextAfterString(inputString, searchString) {
    const index = inputString.indexOf(searchString);
    if (index === -1) {
      return "";
    }
    return inputString.slice(index + searchString.length);
  }
  
  function getTextAfterIndex(inputString, index) {
    if (index < 0 || index >= inputString.length) {
      return "";
    }
    return inputString.slice(index + 1);
  }
  
  function calculateTimeUntilNextHour() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const timeUntilNextHour = nextHour - now;
    const minutes = Math.floor((timeUntilNextHour % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} минут`;
  }
  
  function generateEmbed(title, text, userName, avatarUrl){
    const exampleEmbed = new EmbedBuilder()
      .setColor("c6cfba")
      .setTitle(title)
      .setAuthor({ name: userName, iconURL: 'https://cdn.discordapp.com/emojis/1187070391773048923.webp?size=96&quality=lossless' })
      .setDescription(text)
      .setThumbnail('https://media.discordapp.net/attachments/744843253295218688/1185838652211875860/c4617da7917d629f.gif?ex=6591114e&is=657e9c4e&hm=a4cc46afa1f134c2dbcc036f5a846083165499d1cba8704190c17dde16d34187&')
  
    return { embeds: [exampleEmbed] };
  }
  
  function getTextBeforeString(inputString, searchString) {
    if (!searchString) {
      return inputString;
    }
  
    const index = inputString.indexOf(searchString);
    if (index === -1) {
      return inputString;
    }
    return inputString.slice(0, index);
  }
  
  
  
  function formatText(text) {
    text = text.replace(/\n/g, `
    `);
    text = text.replace(/\s+/g, ' ');
    text = text.replaceAll('"', '');
  
    return text;
  }
  
  async function generateResponse(input, maxTokensLimit) {
  
      let tokensUsed = 0;
  
      while (tokensUsed < maxTokensLimit) {
  
        try {
  
          const response = await query({ "inputs": input, "parameters": { "max_length": 100, "max_new_tokens": 100 } });
          // repetition_penalty: 100 для супер жёстких ответов
  
          if (response.error !== undefined) {
            return Promise.reject(`Что-то пошло не так: ${JSON.stringify(response)}`);
          }
  
          console.log(JSON.stringify(response));
          console.log(response[0].generated_text);
  
          const generatedText = response[0].generated_text;
  
          tokensUsed++;
          input = generatedText;
  
          if (generatedText.includes('[/ANS]') || generatedText.includes('[EOS]') || tokensUsed > 50) {
            let messageReply = truncateText(generatedText, 1700);
            console.log(messageReply);
  
            if (messageReply.length > 0) {
  
              if(tokensUsed > 50){
                messageReply += "...";
              }
  
              return Promise.resolve(messageReply);
            } else {
              return Promise.reject('Бот попытался отправить пустое сообщение');
            }
          }
        } catch (err) {
          
  
          return Promise.reject(err);
        }
      
      }
  
      return Promise.reject('Что-то пошло не так.');
  
    
    
  }
  
  import Discord from "discord.js";
  import { HfInference } from "@huggingface/inference";
  import { Client, Collection, Events, GatewayIntentBits, ActivityType, EmbedBuilder } from "discord.js";
  
  // Дискорд "интенты", позволяют боту писать сообщения
  const client = new Discord.Client({
      intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
  
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions
      ],
      partials: [
        'CHANNEL', // Required to receive DMs
      ]
  });
  
  // Когда бот запущен...
  client.once(Events.ClientReady, async function() {
      // Сообщить о том, что он жив
      console.log(`я жив и я ${client.user.tag}`);
  
      client.user.setPresence({ 
        activities: [{ 
            name: 'Всё ради науки', 
            type: ActivityType.Streaming, 
            url: 'https://youtube.com/watch?v=ponTLgtgYQA' 
        }], 
        status: 'dnd' 
    });
  
    client.guilds.cache.forEach(guild => {
      console.log(`${guild.name} | ${guild.id}`);
    })
  
  });
  
  const HF_TOKEN = config.hf_token;
  
  const inference = new HfInference(HF_TOKEN);
  
  let dialogHistory = {};
  const amnesia = 5;
  
  
  client.on(Events.MessageCreate, async function(message) {
  
  
      // -------------
      // Premissions
  
      if (!message.channel.permissionsFor(client.user.id).has(['SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'ViewChannel', 'AddReactions', 'UseExternalEmojis'])) {
          return
      };
  
      // ------------
  
      // Some message handling
      const commandBody = message.content;
      let index_sent = commandBody.indexOf(".");
      if (index_sent == -1) index_sent = commandBody.length;
      let sent = commandBody.substring(0, index_sent);
  
      if(message.author.bot) return;
  
      // Arguments
  
      const args = sent.toLowerCase().split(" ");
      const command = args.shift().toLowerCase();
      if (commandBody.length > 1700) return;
  
      
  
      if(message.mentions.has(client.user)) {
  
        try{
  
          message.channel.sendTyping();
  
          let stopTyping = false;
  
          const typingInterval = setInterval(() => {
            if (!stopTyping) {
              message.channel.sendTyping();
            } else {
              clearInterval(typingInterval);
            }
          }, 7000);
  
          const inst = `${commandBody}`;
          console.log(`(${message.member.displayName}) - ${commandBody} || I am thinking`);
  
          const channelID = message.channel.id;
  
          if (!dialogHistory[channelID]) {
            dialogHistory[channelID] = [];
          }
          dialogHistory[channelID].push(`[USR] (${message.member.nickname}) ${message.content} [/USR]`);
  
          if (dialogHistory[channelID].length > amnesia) {
            dialogHistory[channelID] = dialogHistory[channelID].slice(0 - amnesia);
          }
          
          const input = dialogHistory[channelID].join('\n') + '\n[ANS]';
  
          console.log(input.length);
  
          function makeAReply(){
            generateResponse(input, 60).then(async (response) => {
  
              if(response.error != undefined) {
                stopTyping = true;
                clearInterval(typingInterval);
    
                console.log(response.error);
                let errr = response;
    
                if(errr.includes("loading")){
                  await new Promise(resolve => setTimeout(resolve, 20000));
                  makeAReply();
                }
                else if(errr.includes("rate")) { message.reply(generateEmbed("тест на терпение - ultimate edition",truncateText(`Что-то пошло не так: ${JSON.stringify(response)}`, 1700), message.author.displayName, message.author.displayAvatarURL)); } 
                else { message.reply(generateEmbed("ОЙ, ОШИБКА!!",truncateText(`Что-то пошло не так: ${response.error}`, 1700), message.author.displayName, message.author.displayAvatarURL)); }
                
                if (!errr.includes("loading")) return;
              }
    
              stopTyping = true;
              clearInterval(typingInterval);
              console.log(JSON.stringify(response));
              console.log(response);
    
              const messageReply = getTextBeforeString(getTextAfterIndex(response, input.length), '[/ANS]');
    
              console.log(messageReply);
    
              if(messageReply.length > 0) {
                message.reply(messageReply);
                dialogHistory[channelID].push(`[ANS] ${messageReply} [/ANS]`);
              } else {
                
                message.reply(`Бот попытался отправить пустое сообщение`);
              }
            })
            .catch(async (error) => {
              // Handle the error 
              if (!error.includes("loading")) { stopTyping = true; clearInterval(typingInterval);}
    
              if(error.includes("loading")){
                await new Promise(resolve => setTimeout(resolve, 20000));
              }
              else if(error.includes("rate")) { message.reply(generateEmbed("тест на терпение - ultimate edition",truncateText(`Что-то пошло не так: ${error}`, 1700), message.author.displayName, message.author.displayAvatarURL)); } 
              else { message.reply(generateEmbed("ОЙ, ОШИБКА!!",truncateText(`Что-то пошло не так: ${error}`, 1700), message.author.displayName, message.author.displayAvatarURL)); }
              
              if (!error.includes("loading")) return;
  
              makeAReply();
            });
          }
  
          makeAReply();
  
        } catch(err){
          try{
            message.channel.send(truncateText(`Что то не сработало: ${err}`,1700));
          } catch(err){
            console.log(truncateText(`Что то не сработало: ${err}`,1700));
          }
        }
  
  
        
      }
  
  
  });
  
  client.login(config.discord_token);
