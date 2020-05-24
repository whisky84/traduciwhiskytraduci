const langCheck = require("../core/lang.check");
const botSend = require("../core/send");
const db = require("../core/db");
const auth = require("../core/auth");
const logger = require("../core/logger");

// Possible commands:
// !t stats: Only in server channel allowed, returns global and server stats
// !t stats server: Only in server channel allowed, returns server stats
// !t stats global: In server channel and dm possible, returns global stats
module.exports = function(data)
{
   //
   // Version Info
   //

   var version = `**\`${data.config.version}\`**`;

   if (auth.changelog)
   {
      version += ` ([changelog](${auth.changelog}))`;
   }

   //
   // Get Stats from Database
   //

   //eslint-disable-next-line complexity
   db.getStats(function(stats)
   {
      // Get global server information
      const botLang = langCheck(stats[0].botLang).valid[0];

      const activeTasks = stats[0].activeTasks - stats[0].activeUserTasks;

      const globalStats =
         `**\`\`\`@${data.bot.username} - Global Stats\`\`\`**\n` +
         `:earth_africa:  Default bot language:  ` +
         `**\`${botLang.name} (${botLang.native})\`` +
         `**\n\n:bar_chart:  Translated **\`${stats[0].totalCount}\`** messages ` +
         `across **\`${stats[0].totalServers}\`** servers\n\n` +
         `:robot:  Version:  ${version}\n\n` +
         `:repeat:  Automatic translation:  ` +
         `**\`${activeTasks}\`**  channels and  ` +
         `**\`${stats[0].activeUserTasks}\`**  users`;

      // Get current server information
      var serverStats = "";
      if (data.message.channel.type === "text" && data.cmd.server.length === 1)
      {
         const serverLang = langCheck(data.cmd.server[0].lang).valid[0];

         const activeServerTasks =
               data.cmd.server[0].activeTasks - data.cmd.server[0].activeUserTasks;

         serverStats =
               `**\`\`\`${data.message.channel.guild.name} - Server Info` +
               `\`\`\`**\n:earth_africa:  Default server language:  ` +
               `**\`${serverLang.name} (${serverLang.native})\`` +
               `**\n\n:bar_chart:  Translated messages:  ` +
               `**\`${data.cmd.server[0].count}\`**\n\n` +
               `:repeat:  Automatic translation:  ` +
               `**\`${activeServerTasks}\`**  channels and  ` +
               `**\`${data.cmd.server[0].activeUserTasks}\`**  users`;
      }

      data.color = "info";

      // Special case: !t stats global
      if (data.cmd.params && data.cmd.params.toLowerCase().includes("global"))
      {
         data.text = globalStats;
         return botSend(data);
      }

      // Only '!t stats global' is allowed with dm
      if (data.message.channel.type === "dm")
      {
         data.color = "warn";
         data.text = "You must call server stats from a server channel.";

         return botSend(data);
      }

      // No server data was available
      if (!serverStats)
      {
         data.color = "error";
         data.text = "This server is not registered in the database.";
         logger(
            "error",
            "'UNREGISTERED'\n" +
            data.message.channel.guild.name + "\n" +
            data.message.channel.guild.id);
         return botSend(data);
      }

      // Case: !t stats server
      if (data.cmd.params && data.cmd.params.toLowerCase().includes("server"))
      {
         data.text = serverStats;

         return botSend(data);
      }

      data.text = globalStats + "\n\n" + serverStats;
      return botSend(data);
   });
};
