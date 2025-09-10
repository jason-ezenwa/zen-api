import { CronJob } from "cron";
import axios from "axios";

const zenBaseUrl = "https://zen-api-68zd.onrender.com";

/**
 * calls '/' endpoint every 0 seconds, 14 minutes to keep the application running
 * this prevents the render app from sleeping after 15 minutes of inactivity
 */
export const job = new CronJob("0 */14 * * * *", async function () {
  try {
    const response = await axios.get(zenBaseUrl);

    if (response.status === 200) {
      console.log("prevented inactivity.");
    }
  } catch (error) {
    console.log("unable to perform cron job to prevent inactivity");

    console.log(error);
  }
});
