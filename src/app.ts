import dotenv from "dotenv";
dotenv.config();

import {
  Metadata,
  Server,
  ServerCredentials,
  credentials,
} from "@grpc/grpc-js";
import {
  WifiServiceService,
  LoginRequest,
  LoginResponse,
} from "./generated/wifi";
import { GuestServiceClient } from "./generated/guest";
import { generateServiceError } from "./utils";
import { Callback } from "./utils/types";
import { connect, StringCodec } from "nats";

const sc = StringCodec();

async function publishGuestEvent(guestData: any) {
  const nc = await connect({
    servers:
      process.env.NODE_ENV === "development"
        ? "nats://localhost:4222"
        : process.env.NATS_URL,
  });

  nc.publish("guest.update", sc.encode(JSON.stringify(guestData)));
  console.log("Guest update event published");

  await nc.drain();
}

const server = new Server();
const guestServiceClient = new GuestServiceClient(
  process.env.NODE_ENV === "development"
    ? "localhost:50051"
    : process.env.GRPC_GUESTS_URL!,
  credentials.createInsecure()
);

server.addService(WifiServiceService, {
  async login(
    call: { request: LoginRequest },
    callback: Callback<LoginResponse>
  ) {
    console.log("WiFi login request received");
    const { lastName, roomNumber } = call.request;

    guestServiceClient.getGuestByLastNameAndRoom(
      { lastName, roomNumber },
      (error, guest) => {
        console.log("Get guest response sent");
        if (error) {
          console.error("Error in get guest process:", error);
          callback(generateServiceError(error), null);
          return;
        }

        if (!guest) {
          console.error("No user found");
          callback(
            {
              name: "NoUserError",
              message: "No user found",
              code: 13,
              details: "No user found",
              metadata: new Metadata(),
            },
            null
          );
          return;
        }

        try {
          console.log("Publishing WiFi login count increment event");
          publishGuestEvent({
            event: "increment.wifi.login.count",
            data: { lastName, roomNumber },
          });
          console.log("Wifi login count increment event published");
        } catch (error) {
          console.error(
            "Failed to publish wifi login count increment event:",
            error
          );
        }

        callback(null, { success: true });
        console.log("WiFi login response sent");
      }
    );
  },
});

const port = process.env.NODE_ENV === "development" ? 50052 : 50051;
server.bindAsync(
  `0.0.0.0:${port}`,
  ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(`Failed to bind server: ${err.message}`);
      return;
    }
    console.log(`Server running at http://0.0.0.0:${port}`);
  }
);
